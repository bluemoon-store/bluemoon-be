import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class SettingsUpdateGeneralRequestDto {
    @ApiPropertyOptional({ maxLength: 2048, nullable: true })
    @ValidateIf(
        (_, value) => value !== null && value !== undefined && value !== ''
    )
    @IsString()
    @MaxLength(2048)
    @Matches(/^(\/|https:\/\/)/, {
        message: 'settings.error.invalidSupportLink',
    })
    supportLink?: string | null;
}
