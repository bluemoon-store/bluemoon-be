import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';

import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';

export class TeamInviteRequestDto {
    @ApiProperty({ example: 'member@jinx.to' })
    @IsEmail()
    @Transform(({ value }) => value?.toLowerCase().trim())
    public email: string;

    @ApiProperty({ enum: Role, example: Role.OWNER })
    @IsIn(ADMIN_ROLES)
    public role: Role;

    @ApiPropertyOptional({ example: 'John Team' })
    @IsString()
    @IsOptional()
    @Length(1, 100)
    @Transform(({ value }) => value?.trim())
    public name?: string;
}
