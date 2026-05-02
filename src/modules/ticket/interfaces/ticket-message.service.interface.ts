import { Role } from '@prisma/client';

import { TicketMessageCreateDto } from '../dtos/request/ticket-message.create.request';
import { TicketMessageResponseDto } from '../dtos/response/ticket-message.response';
import { TicketMessagesCursorResponseDto } from '../dtos/response/ticket-messages-cursor.response';

export interface ITicketMessageService {
    sendCustomerMessage(
        ticketId: string,
        actor: { userId: string; role: Role },
        data: TicketMessageCreateDto
    ): Promise<TicketMessageResponseDto>;
    sendStaffMessage(
        ticketId: string,
        actor: { userId: string; role: Role },
        data: TicketMessageCreateDto
    ): Promise<TicketMessageResponseDto>;
    listMessages(
        ticketId: string,
        actor: { userId: string; role: Role },
        params: { limit?: number; cursor?: string }
    ): Promise<TicketMessagesCursorResponseDto>;
}
