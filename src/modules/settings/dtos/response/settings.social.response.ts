import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SettingsSocialResponseDto {
    @ApiPropertyOptional({ nullable: true })
    @Expose()
    telegramLink: string | null;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    discordLink: string | null;
}
