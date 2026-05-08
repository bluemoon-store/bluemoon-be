import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SettingsPublicResponseDto {
    @ApiPropertyOptional({ nullable: true })
    @Expose()
    supportLink: string | null;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    telegramLink: string | null;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    discordLink: string | null;
}
