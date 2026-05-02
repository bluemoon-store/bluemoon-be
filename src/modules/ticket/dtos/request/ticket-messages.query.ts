import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TicketMessagesQueryDto {
    @ApiPropertyOptional({
        description:
            'Load messages older than this message id (see response nextCursor)',
    })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ example: 50, default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
