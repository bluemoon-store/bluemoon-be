import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class TicketAttachmentInputDto {
    @ApiProperty({
        example: 'https://storage.bluemoon.example/ticket-attachments/xyz.png',
    })
    @IsUrl()
    url: string;

    @ApiProperty({ example: 'screenshot.png' })
    @IsString()
    @MaxLength(255)
    fileName: string;

    @ApiProperty({ example: 'image/png' })
    @IsString()
    @MaxLength(100)
    mimeType: string;

    @ApiProperty({ example: 24530 })
    @IsInt()
    size: number;
}

export class TicketMessageCreateDto {
    @ApiProperty({ example: 'Thanks for the details, looking into this now.' })
    @IsString()
    @MinLength(1)
    @MaxLength(5000)
    message: string;

    @ApiPropertyOptional({
        type: [TicketAttachmentInputDto],
        description: 'Pre-uploaded attachments referenced by URL',
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @ValidateNested({ each: true })
    @Type(() => TicketAttachmentInputDto)
    attachments?: TicketAttachmentInputDto[];
}
