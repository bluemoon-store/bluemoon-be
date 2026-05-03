import { Role } from '@prisma/client';

import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { TicketCreateDto } from '../dtos/request/ticket.create.request';
import { TicketAdminListQueryDto } from '../dtos/request/ticket-list-admin.request';
import { TicketListQueryDto } from '../dtos/request/ticket-list.request';
import { TicketUpdateDto } from '../dtos/request/ticket.update.request';
import {
    TicketDetailResponseDto,
    TicketResponseDto,
} from '../dtos/response/ticket.response';

export interface ITicketService {
    createTicket(
        userId: string,
        data: TicketCreateDto
    ): Promise<TicketDetailResponseDto>;
    getUserTickets(
        userId: string,
        query: TicketListQueryDto
    ): Promise<ApiPaginatedDataDto<TicketResponseDto>>;
    getAllTickets(
        query: TicketAdminListQueryDto
    ): Promise<ApiPaginatedDataDto<TicketResponseDto>>;
    getTicketDetail(
        ticketId: string,
        actor: { userId: string; role: Role }
    ): Promise<TicketDetailResponseDto>;
    updateTicket(
        ticketId: string,
        data: TicketUpdateDto,
        actor: { userId: string; role: Role }
    ): Promise<TicketResponseDto>;
    closeTicket(
        ticketId: string,
        actor: { userId: string; role: Role }
    ): Promise<TicketResponseDto>;
    resolveTicketByOwner(
        ticketId: string,
        userId: string
    ): Promise<TicketResponseDto>;
    markRead(ticketId: string): Promise<void>;
}
