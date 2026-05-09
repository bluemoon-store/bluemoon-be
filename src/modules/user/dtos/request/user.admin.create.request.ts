import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsEmail,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';

/**
 * Admin-created regular users use the same username rules as team invitations
 * (explicit username assignment).
 */
export class UserAdminCreateDto {
    @ApiProperty({
        example: 'jane.doe',
        description:
            '3–32 chars: lowercase letters, digits, dot, underscore, hyphen',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value
    )
    @IsString()
    @Matches(/^[a-z0-9._-]{3,32}$/, {
        message:
            'Username must be 3–32 chars: lowercase letters, digits, dot, underscore, hyphen',
    })
    userName: string;

    @ApiProperty({ example: 'jane@example.com' })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value
    )
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ example: 'Jane', maxLength: 64 })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() || undefined : value
    )
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe', maxLength: 64 })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() || undefined : value
    )
    lastName?: string;

    @ApiPropertyOptional({ example: '+15551234567', maxLength: 32 })
    @IsOptional()
    @IsString()
    @MaxLength(32)
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() || undefined : value
    )
    phone?: string;

    @ApiPropertyOptional({
        description:
            'When true, sets isVerified so the user can sign in without verifying email',
    })
    @IsOptional()
    @IsBoolean()
    markVerified?: boolean;
}
