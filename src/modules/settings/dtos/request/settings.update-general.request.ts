import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SettingsUpdateGeneralRequestDto {
    @ApiPropertyOptional({ maxLength: 2048, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    @Matches(/^(\/|https:\/\/)/, {
        message: 'settings.error.invalidSupportLink',
    })
    supportLink?: string | null;
}
