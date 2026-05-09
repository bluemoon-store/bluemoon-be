import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { ActivityLogCategory } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import {
    READ_ADMIN_ROLES,
    STAFF_OPERATIONS_ROLES,
} from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { AuditLog } from 'src/modules/activity-log/decorators/audit-log.decorator';

import { AdminVouchListQueryDto } from '../dtos/request/vouch.admin-list.request';
import { VouchResponseDto } from '../dtos/response/vouch.response';
import { VouchService } from '../services/vouch.service';

@ApiTags('admin.vouch')
@Controller({
    path: '/admin/vouches',
    version: '1',
})
export class VouchAdminController {
    constructor(private readonly vouchService: VouchService) {}

    @Get()
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List vouches (admin moderation)' })
    @DocPaginatedResponse({
        serialization: VouchResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'vouch.success.list',
    })
    public async list(
        @Query(new QueryTransformPipe()) query: AdminVouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>> {
        return this.vouchService.listAdmin(query);
    }

    @Patch(':id/approve')
    @AuditLog({
        action: 'vouch.approve',
        category: ActivityLogCategory.VOUCH,
        resourceType: 'Vouch',
        resourceIdParam: 'id',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Approve vouch (publish to storefront)' })
    @DocResponse({
        serialization: VouchResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'vouch.success.approved',
    })
    public async approve(
        @AuthUser() user: IAuthUser,
        @Param('id') id: string
    ): Promise<VouchResponseDto> {
        return this.vouchService.approveAdmin(id, user.userId);
    }

    @Delete(':id')
    @AuditLog({
        action: 'vouch.delete',
        category: ActivityLogCategory.VOUCH,
        resourceType: 'Vouch',
        resourceIdParam: 'id',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete vouch (admin soft delete)' })
    @HttpCode(HttpStatus.NO_CONTENT)
    public async delete(@Param('id') id: string): Promise<void> {
        await this.vouchService.deleteAdmin(id);
    }
}
