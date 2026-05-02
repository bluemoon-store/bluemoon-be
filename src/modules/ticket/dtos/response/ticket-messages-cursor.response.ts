import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

import { TicketMessageResponseDto } from './ticket-message.response';

export class TicketMessagesCursorResponseDto {
    @ApiProperty({ type: [TicketMessageResponseDto] })
    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TicketMessageResponseDto)
    items: TicketMessageResponseDto[];

    @ApiPropertyOptional({
        nullable: true,
        description:
            'Pass as cursor to load the next page of older messages (most recent page first)',
    })
    @Expose()
    @IsOptional()
    @IsString()
    nextCursor: string | null;
}
