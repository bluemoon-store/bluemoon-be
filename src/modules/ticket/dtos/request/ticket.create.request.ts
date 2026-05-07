import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '@prisma/client';
import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class TicketCreateDto {
    @ApiProperty({ example: 'My order has not been delivered' })
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    subject: string;

    @ApiProperty({ example: 'Hello, my order EB2DFF was paid 2 hours ago...' })
    @IsString()
    @MinLength(1)
    @MaxLength(5000)
    message: string;

    @ApiProperty({
        example: 'ORD-20260507-AB12C',
    })
    @IsString()
    @MinLength(1)
    @MaxLength(64)
    orderNumber: string;

    @ApiPropertyOptional({ enum: TicketPriority })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;
}
