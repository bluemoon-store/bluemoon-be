import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SettingsEmailValidityTestResponseDto {
    @ApiProperty()
    @Expose()
    ok: boolean;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    status: number | null;

    @ApiProperty()
    @Expose()
    latencyMs: number;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    error?: string;
}
