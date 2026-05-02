import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

import { TicketListQueryDto } from './ticket-list.request';

export class TicketAdminListQueryDto extends TicketListQueryDto {
    @ApiPropertyOptional({ description: 'Filter by assignee staff user id' })
    @IsOptional()
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
