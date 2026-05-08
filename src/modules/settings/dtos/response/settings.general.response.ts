import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SettingsGeneralResponseDto {
    @ApiPropertyOptional({ nullable: true })
    @Expose()
    supportLink: string | null;
}
