import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';

export enum TeamMemberStatus {
    ACTIVE = 'active',
    DEACTIVATED = 'deactivated',
}

/** Roles assignable when updating a team member (includes USER to demote). */
export const TEAM_MEMBER_UPDATABLE_ROLES: Role[] = [...ADMIN_ROLES, Role.USER];

export class TeamUpdateRequestDto {
    @ApiPropertyOptional({ enum: Role, example: Role.MOD })
    @IsIn(TEAM_MEMBER_UPDATABLE_ROLES)
    @IsOptional()
    public role?: Role;

    @ApiPropertyOptional({
        enum: TeamMemberStatus,
        example: TeamMemberStatus.ACTIVE,
    })
    @IsEnum(TeamMemberStatus)
    @IsOptional()
    public status?: TeamMemberStatus;
}
