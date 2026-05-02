import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class TicketAttachmentPresignDto {
    @ApiProperty({ example: 'screenshot.png' })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    fileName: string;

    @ApiProperty({ example: 'image/png' })
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    contentType: string;
}
