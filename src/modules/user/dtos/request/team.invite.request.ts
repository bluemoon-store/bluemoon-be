import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Matches,
} from 'class-validator';

import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';

export class TeamInviteRequestDto {
    @ApiProperty({ example: 'member@jinx.to' })
    @IsEmail()
    @Transform(({ value }) => value?.toLowerCase().trim())
    public email: string;

    @ApiProperty({ enum: Role, example: Role.OWNER })
    @IsIn(ADMIN_ROLES)
    public role: Role;

    @ApiProperty({ example: 'jane.doe' })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.toLowerCase().trim() : value
    )
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9._-]{3,32}$/, {
        message:
            'Username must be 3–32 chars: lowercase letters, digits, dot, underscore, hyphen',
    })
    public userName: string;

    @ApiPropertyOptional({ example: 'John Team' })
    @IsString()
    @IsOptional()
    @Length(1, 100)
    @Transform(({ value }) => value?.trim())
    public name?: string;
}
