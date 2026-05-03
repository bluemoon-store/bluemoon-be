import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

import { TicketListQueryDto } from './ticket-list.request';

export const TICKET_UNASSIGNED_FILTER = 'unassigned' as const;

export class TicketAdminListQueryDto extends TicketListQueryDto {
    @ApiPropertyOptional({
        description:
            'Filter by assignee staff user id, or literal "unassigned" for OPEN queue (assignedToId IS NULL)',
    })
    @IsOptional()
    @ValidateIf(
        (_, v: string | undefined) =>
            v !== undefined && v !== TICKET_UNASSIGNED_FILTER
    )
    @IsUUID()
    assignedToId?: string;

    @ApiPropertyOptional({ description: 'Filter by ticket creator user id' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ description: 'Filter by linked order id' })
    @IsOptional()
    @IsUUID()
    orderId?: string;

    @ApiPropertyOptional({
        description:
            'Search across ticketNumber, order.orderNumber and user.email',
    })
    @IsOptional()
    @IsString()
    search?: string;
}
