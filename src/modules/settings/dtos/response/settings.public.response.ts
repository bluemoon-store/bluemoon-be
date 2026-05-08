import { ApiPropertyOptional } from '@nestjs/swagger';

export class SettingsPublicResponseDto {
    @ApiPropertyOptional({ nullable: true })
    supportLink: string | null;

    @ApiPropertyOptional({ nullable: true })
    telegramLink: string | null;

    @ApiPropertyOptional({ nullable: true })
    discordLink: string | null;
}
