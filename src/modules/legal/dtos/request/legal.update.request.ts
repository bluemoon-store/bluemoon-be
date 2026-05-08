import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LegalUpdateRequestDto {
    @ApiPropertyOptional({ maxLength: 255, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiProperty({ maxLength: 200000 })
    @IsString()
    @MaxLength(200000)
    content: string;
}
