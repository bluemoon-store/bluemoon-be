import { ApiPropertyOptional } from '@nestjs/swagger';

export class SettingsSocialResponseDto {
    @ApiPropertyOptional({ nullable: true })
    telegramLink: string | null;

    @ApiPropertyOptional({ nullable: true })
    discordLink: string | null;
}
