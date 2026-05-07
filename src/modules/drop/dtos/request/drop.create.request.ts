import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayUnique,
    IsBoolean,
    IsArray,
    IsDateString,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class DropCreateDto {
    @ApiProperty()
    @IsUUID('4')
    productId: string;

    @ApiProperty()
    @IsUUID('4')
    variantId: string;

    @ApiProperty({ example: 5, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiPropertyOptional({ nullable: true, maxLength: 512 })
    @IsOptional()
    @IsString()
    @MaxLength(512)
    description?: string | null;

    @ApiPropertyOptional({
        type: [String],
        description: 'Lowercased allowlist; empty means all users',
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (!Array.isArray(value)) {
            return [];
        }
        return [
            ...new Set(
                value
                    .map((v: unknown) =>
                        typeof v === 'string' ? v.trim().toLowerCase() : ''
                    )
                    .filter(Boolean)
            ),
        ];
    })
    @IsArray()
    @ArrayUnique()
    @Matches(EMAIL_REGEX, { each: true, message: 'invalid email format' })
    allowedEmails?: string[];

    @ApiPropertyOptional({
        nullable: true,
        description: 'ISO date string; null or omit for never expires',
    })
    @IsOptional()
    @ValidateIf((_o, v) => v != null)
    @IsDateString()
    expiresAt?: string | null;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
