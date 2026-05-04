import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsNumber, IsOptional } from 'class-validator';

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

    @ApiPropertyOptional({
        enum: TicketStatus,
        isArray: true,
        description:
            'Repeat `status` for multiple values (e.g. IN_PROGRESS and WAITING_USER).',
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return Array.isArray(value) ? value : [value];
    })
    @IsArray()
    @IsEnum(TicketStatus, { each: true })
    status?: TicketStatus[];

    @ApiPropertyOptional({
        description:
            'UI tab grouping: pending=OPEN, active=IN_PROGRESS|WAITING_USER, closed=RESOLVED|CLOSED',
        enum: ['pending', 'active', 'closed'],
    })
    @IsOptional()
    @IsIn(['pending', 'active', 'closed'])
    tab?: 'pending' | 'active' | 'closed';
}
