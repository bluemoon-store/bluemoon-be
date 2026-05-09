import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SettingsUpdateSocialRequestDto {
    @ApiPropertyOptional({ maxLength: 2048, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    telegramLink?: string | null;

    @ApiPropertyOptional({ maxLength: 2048, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    discordLink?: string | null;
}
