import { ApiPropertyOptional } from '@nestjs/swagger';

export class SettingsGeneralResponseDto {
    @ApiPropertyOptional({ nullable: true })
    supportLink: string | null;
}
