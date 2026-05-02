import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsOptional } from 'class-validator';

export class TicketListQueryDto {
    @ApiPropertyOptional({ example: 1, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ example: 20, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({ enum: TicketStatus })
    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;

    @ApiPropertyOptional({
        description:
            'UI tab grouping: pending=OPEN, active=IN_PROGRESS|WAITING_USER, closed=RESOLVED|CLOSED',
        enum: ['pending', 'active', 'closed'],
    })
    @IsOptional()
    @IsIn(['pending', 'active', 'closed'])
    tab?: 'pending' | 'active' | 'closed';
}
