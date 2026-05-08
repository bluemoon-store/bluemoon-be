import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SettingsUpdateSocialRequestDto {
    @ApiPropertyOptional({ maxLength: 2048, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    @Matches(/^https:\/\/(t\.me|telegram\.me)\/.+/i, {
        message: 'settings.error.invalidTelegramLink',
    })
    telegramLink?: string | null;

    @ApiPropertyOptional({ maxLength: 2048, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    @Matches(/^https:\/\/(discord\.gg|discord\.com|discord\.gift)\/.+/i, {
        message: 'settings.error.invalidDiscordLink',
    })
    discordLink?: string | null;
}
