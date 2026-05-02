import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';

import { DatabaseService } from 'src/common/database/services/database.service';
import {
    isPrivilegedAdminRole,
    isSuperAdminRole,
} from 'src/common/request/constants/roles.constant';

import { TicketMessageResponseDto } from '../dtos/response/ticket-message.response';
import { TicketResponseDto } from '../dtos/response/ticket.response';

interface SocketAuthPayload {
    userId: string;
    role: Role;
}

@WebSocketGateway({
    namespace: '/tickets',
})
export class TicketGateway implements OnGatewayConnection {
    private readonly logger = new Logger(TicketGateway.name);

    @WebSocketServer()
    server: Server;

    private readonly accessSecret: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly databaseService: DatabaseService
    ) {
        this.accessSecret = this.configService.getOrThrow<string>(
            'auth.accessToken.secret'
        );
    }

    async handleConnection(client: Socket): Promise<void> {
        try {
            const raw = client.handshake.auth as { token?: string };
            const token = raw?.token;
            if (!token || typeof token !== 'string') {
                client.disconnect(true);
                return;
            }
            const payload =
                await this.jwtService.verifyAsync<SocketAuthPayload>(token, {
                    secret: this.accessSecret,
                });
            if (!payload?.userId || payload.role === undefined) {
                client.disconnect(true);
                return;
            }
            client.data.userId = payload.userId;
            client.data.role = payload.role;
        } catch {
            client.disconnect(true);
        }
    }

    emitNewMessage(ticketId: string, message: TicketMessageResponseDto): void {
        this.server.to(`ticket:${ticketId}`).emit('ticket:message', message);
    }

    emitTicketUpdated(ticketId: string, ticket: TicketResponseDto): void {
        this.server.to(`ticket:${ticketId}`).emit('ticket:updated', ticket);
    }

    emitRead(
        ticketId: string,
        payload: { ticketId: string; lastStaffReadAt: Date | null }
    ): void {
        this.server.to(`ticket:${ticketId}`).emit('ticket:read', payload);
    }

    @SubscribeMessage('ticket:join')
    async handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { ticketId?: string }
    ): Promise<void> {
        const ticketId = body?.ticketId;
        const userId = client.data.userId as string | undefined;
        const role = client.data.role as Role | undefined;
        if (!ticketId || !userId || role === undefined) {
            return;
        }

        const ok = await this.canJoinTicket(ticketId, userId, role);
        if (!ok) {
            this.logger.warn({ ticketId, userId }, 'ticket:join denied');
            return;
        }

        await client.join(`ticket:${ticketId}`);
    }

    @SubscribeMessage('ticket:leave')
    async handleLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { ticketId?: string }
    ): Promise<void> {
        const ticketId = body?.ticketId;
        if (!ticketId) {
            return;
        }
        await client.leave(`ticket:${ticketId}`);
    }

    @SubscribeMessage('ticket:typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        body: { ticketId?: string; typing?: boolean }
    ): Promise<void> {
        const ticketId = body?.ticketId;
        const userId = client.data.userId as string | undefined;
        const role = client.data.role as Role | undefined;
        if (!ticketId || !userId || role === undefined) {
            return;
        }

        const ok = await this.canJoinTicket(ticketId, userId, role);
        if (!ok) {
            return;
        }

        client.to(`ticket:${ticketId}`).emit('ticket:typing', {
            ticketId,
            userId,
            typing: Boolean(body?.typing),
        });
    }

    private async canJoinTicket(
        ticketId: string,
        userId: string,
        role: Role
    ): Promise<boolean> {
        if (isSuperAdminRole(role) || isPrivilegedAdminRole(role)) {
            return true;
        }

        const ticket = await this.databaseService.supportTicket.findFirst({
            where: { id: ticketId, deletedAt: null },
            select: {
                userId: true,
                assignedToId: true,
            },
        });

        if (!ticket) {
            return false;
        }

        return ticket.userId === userId || ticket.assignedToId === userId;
    }
}
