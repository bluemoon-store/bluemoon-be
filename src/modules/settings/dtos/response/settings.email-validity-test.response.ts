import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SettingsEmailValidityTestResponseDto {
    @ApiProperty()
    ok: boolean;

    @ApiPropertyOptional({ nullable: true })
    status: number | null;

    @ApiProperty()
    latencyMs: number;

    @ApiPropertyOptional({ nullable: true })
    error?: string;
}
