import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '@prisma/client';
import {
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
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

    @ApiPropertyOptional({
        example: 'a13d0e4a-b8ec-4c3a-b5e2-1f6f9f6f6f6f',
        nullable: true,
    })
    @IsOptional()
    @IsUUID()
    orderId?: string;

    @ApiPropertyOptional({ enum: TicketPriority })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;
}
