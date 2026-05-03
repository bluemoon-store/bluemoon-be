import {
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import {
    isPrivilegedAdminRole,
    isSuperAdminRole,
} from 'src/common/request/constants/roles.constant';

import { TicketMessageCreateDto } from '../dtos/request/ticket-message.create.request';
import { TicketMessageResponseDto } from '../dtos/response/ticket-message.response';
import { TicketMessagesCursorResponseDto } from '../dtos/response/ticket-messages-cursor.response';
import { TicketGateway } from '../gateways/ticket.gateway';
import { ITicketMessageService } from '../interfaces/ticket-message.service.interface';
import { mapMessage, mapTicketListItem } from '../ticket.mapper';

@Injectable()
export class TicketMessageService implements ITicketMessageService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly ticketGateway: TicketGateway
    ) {}

    async sendCustomerMessage(
        ticketId: string,
        actor: { userId: string; role: Role },
        data: TicketMessageCreateDto
    ): Promise<TicketMessageResponseDto> {
        await this.assertTicketAccess(ticketId, actor);

        const ticket = await this.databaseService.supportTicket.findFirst({
            where: { id: ticketId, deletedAt: null },
        });
        if (!ticket) {
            throw new HttpException(
                'ticket.error.ticketNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        if (ticket.userId !== actor.userId) {
            throw new HttpException(
                'ticket.error.forbidden',
                HttpStatus.FORBIDDEN
            );
        }

        let nextStatus = ticket.status;
        if (ticket.status === TicketStatus.IN_PROGRESS) {
            nextStatus = TicketStatus.WAITING_USER;
        } else if (ticket.status === TicketStatus.WAITING_USER) {
            nextStatus = TicketStatus.IN_PROGRESS;
        }

        const row = await this.databaseService.$transaction(async tx => {
            const msg = await tx.ticketMessage.create({
                data: {
                    ticketId,
                    userId: actor.userId,
                    message: data.message,
                    isStaff: false,
                    attachments: data.attachments?.length
                        ? {
                              create: data.attachments.map(a => ({
                                  url: a.url,
                                  fileName: a.fileName,
                                  mimeType: a.mimeType,
                                  size: a.size,
                              })),
                          }
                        : undefined,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            email: true,
                        },
                    },
                    attachments: true,
                },
            });

            if (nextStatus !== ticket.status) {
                await tx.supportTicket.update({
                    where: { id: ticketId },
                    data: { status: nextStatus },
                });
            }

            return msg;
        });

        const dto = mapMessage(row);
        this.ticketGateway.emitNewMessage(ticketId, dto);

        if (nextStatus !== ticket.status) {
            await this.emitTicketListSnapshot(ticketId);
        }

        return dto;
    }

    async sendStaffMessage(
        ticketId: string,
        actor: { userId: string; role: Role },
        data: TicketMessageCreateDto
    ): Promise<TicketMessageResponseDto> {
        await this.assertTicketAccess(ticketId, actor);

        if (
            !isSuperAdminRole(actor.role) &&
            !isPrivilegedAdminRole(actor.role)
        ) {
            throw new HttpException(
                'ticket.error.forbidden',
                HttpStatus.FORBIDDEN
            );
        }

        const ticket = await this.databaseService.supportTicket.findFirst({
            where: { id: ticketId, deletedAt: null },
        });
        if (!ticket) {
            throw new HttpException(
                'ticket.error.ticketNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        if (
            !isSuperAdminRole(actor.role) &&
            ticket.assignedToId !== actor.userId
        ) {
            throw new ForbiddenException('ticket.error.notAssignedToYou');
        }

        let nextStatus = ticket.status;
        if (
            ticket.status === TicketStatus.OPEN ||
            ticket.status === TicketStatus.WAITING_USER
        ) {
            nextStatus = TicketStatus.IN_PROGRESS;
        }

        const row = await this.databaseService.$transaction(async tx => {
            const msg = await tx.ticketMessage.create({
                data: {
                    ticketId,
                    userId: actor.userId,
                    message: data.message,
                    isStaff: true,
                    attachments: data.attachments?.length
                        ? {
                              create: data.attachments.map(a => ({
                                  url: a.url,
                                  fileName: a.fileName,
                                  mimeType: a.mimeType,
                                  size: a.size,
                              })),
                          }
                        : undefined,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            email: true,
                        },
                    },
                    attachments: true,
                },
            });

            if (nextStatus !== ticket.status) {
                await tx.supportTicket.update({
                    where: { id: ticketId },
                    data: { status: nextStatus },
                });
            }

            return msg;
        });

        const dto = mapMessage(row);
        this.ticketGateway.emitNewMessage(ticketId, dto);

        if (nextStatus !== ticket.status) {
            await this.emitTicketListSnapshot(ticketId);
        }

        return dto;
    }

    async listMessages(
        ticketId: string,
        actor: { userId: string; role: Role },
        params: { limit?: number; cursor?: string }
    ): Promise<TicketMessagesCursorResponseDto> {
        await this.assertTicketAccess(ticketId, actor);

        const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);

        if (!params.cursor) {
            const batch = await this.databaseService.ticketMessage.findMany({
                where: { ticketId },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                take: limit + 1,
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            role: true,
                            email: true,
                        },
                    },
                    attachments: true,
                },
            });

            const hasMore = batch.length > limit;
            const slice = hasMore ? batch.slice(0, limit) : batch;
            const chronological = [...slice].reverse();
            const items = chronological.map(mapMessage);
            const nextCursor =
                hasMore && chronological.length > 0
                    ? chronological[0].id
                    : null;

            return { items, nextCursor };
        }

        const anchor = await this.databaseService.ticketMessage.findFirst({
            where: { id: params.cursor, ticketId },
        });
        if (!anchor) {
            throw new HttpException(
                'ticket.error.ticketNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        const batch = await this.databaseService.ticketMessage.findMany({
            where: {
                ticketId,
                OR: [
                    { createdAt: { lt: anchor.createdAt } },
                    {
                        AND: [
                            { createdAt: anchor.createdAt },
                            { id: { lt: anchor.id } },
                        ],
                    },
                ],
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit + 1,
            include: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true,
                        email: true,
                    },
                },
                attachments: true,
            },
        });

        const hasMore = batch.length > limit;
        const slice = hasMore ? batch.slice(0, limit) : batch;
        const chronological = [...slice].reverse();
        const items = chronological.map(mapMessage);
        const nextCursor =
            hasMore && chronological.length > 0 ? chronological[0].id : null;

        return { items, nextCursor };
    }

    private async assertTicketAccess(
        ticketId: string,
        actor: { userId: string; role: Role }
    ): Promise<void> {
        const ticket = await this.databaseService.supportTicket.findFirst({
            where: { id: ticketId, deletedAt: null },
            select: {
                userId: true,
                assignedToId: true,
            },
        });

        if (!ticket) {
            throw new HttpException(
                'ticket.error.ticketNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        if (isSuperAdminRole(actor.role) || isPrivilegedAdminRole(actor.role)) {
            return;
        }

        if (
            ticket.userId === actor.userId ||
            ticket.assignedToId === actor.userId
        ) {
            return;
        }

        throw new HttpException('ticket.error.forbidden', HttpStatus.FORBIDDEN);
    }

    private async countStaffUnread(
        ticketId: string,
        lastStaffReadAt: Date | null
    ): Promise<number> {
        return this.databaseService.ticketMessage.count({
            where: {
                ticketId,
                isStaff: false,
                ...(lastStaffReadAt
                    ? { createdAt: { gt: lastStaffReadAt } }
                    : {}),
            },
        });
    }

    private async emitTicketListSnapshot(ticketId: string): Promise<void> {
        const row = await this.databaseService.supportTicket.findFirst({
            where: { id: ticketId, deletedAt: null },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        userName: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        email: true,
                        userName: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        user: {
                            select: {
                                id: true,
                                userName: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                role: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!row) {
            return;
        }

        const unreadCount = await this.countStaffUnread(
            row.id,
            row.lastStaffReadAt
        );
        const dto = mapTicketListItem(row, unreadCount);
        this.ticketGateway.emitTicketUpdated(ticketId, dto);
    }
}
