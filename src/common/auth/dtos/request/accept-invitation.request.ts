import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MinLength,
} from 'class-validator';

export class AcceptInvitationRequestDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(36)
    public token: string;

    @ApiProperty({ example: 'NewStr0ng!Pass', required: true })
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
        }
    )
    public password: string;

    @ApiPropertyOptional({ example: 'new-admin-user' })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const s = String(value).trim().toLowerCase();
        return s === '' ? undefined : s;
    })
    @IsString()
    @Matches(/^[a-z0-9._-]{3,32}$/, {
        message:
            'Username must be 3–32 chars: lowercase letters, digits, dot, underscore, hyphen',
    })
    public userName?: string;
}
