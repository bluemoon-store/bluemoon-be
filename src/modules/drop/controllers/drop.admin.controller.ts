import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ActivityLogCategory } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import {
    READ_ADMIN_ROLES,
    STAFF_OPERATIONS_ROLES,
} from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { AuditLog } from 'src/modules/activity-log/decorators/audit-log.decorator';

import { DropCreateDto } from '../dtos/request/drop.create.request';
import { DropListQueryDto } from '../dtos/request/drop.list.request';
import { DropUpdateDto } from '../dtos/request/drop.update.request';
import { DropResponseDto } from '../dtos/response/drop.response';
import { DropService } from '../services/drop.service';

@ApiTags('admin.drop')
@Controller({
    path: '/admin/drops',
    version: '1',
})
export class DropAdminController {
    constructor(private readonly dropService: DropService) {}

    @Post()
    @AuditLog({
        action: 'drop.create',
        category: ActivityLogCategory.DROP,
        resourceType: 'Drop',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create drop' })
    @DocResponse({
        serialization: DropResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'drop.success.created',
    })
    async create(@Body() payload: DropCreateDto): Promise<DropResponseDto> {
        return this.dropService.create(payload);
    }

    @Get()
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List drops' })
    @DocPaginatedResponse({
        serialization: DropResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.list',
    })
    async list(
        @Query(new QueryTransformPipe()) query: DropListQueryDto
    ): Promise<ApiPaginatedDataDto<DropResponseDto>> {
        return this.dropService.findAll(query);
    }

    @Get(':id')
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get drop by ID' })
    @DocResponse({
        serialization: DropResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.found',
    })
    async getById(@Param('id') id: string): Promise<DropResponseDto> {
        return this.dropService.findOne(id);
    }

    @Put(':id')
    @AuditLog({
        action: 'drop.update',
        category: ActivityLogCategory.DROP,
        resourceType: 'Drop',
        resourceIdParam: 'id',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update drop' })
    @DocResponse({
        serialization: DropResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.updated',
    })
    async update(
        @Param('id') id: string,
        @Body() payload: DropUpdateDto
    ): Promise<DropResponseDto> {
        return this.dropService.update(id, payload);
    }

    @Put(':id/toggle-active')
    @AuditLog({
        action: 'drop.toggle.active',
        category: ActivityLogCategory.DROP,
        resourceType: 'Drop',
        resourceIdParam: 'id',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Toggle drop active flag' })
    @DocResponse({
        serialization: DropResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.updated',
    })
    async toggleActive(@Param('id') id: string): Promise<DropResponseDto> {
        return this.dropService.toggleActive(id);
    }

    @Delete(':id')
    @AuditLog({
        action: 'drop.delete',
        category: ActivityLogCategory.DROP,
        resourceType: 'Drop',
        resourceIdParam: 'id',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Soft delete drop' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.deleted',
    })
    async delete(@Param('id') id: string): Promise<ApiGenericResponseDto> {
        return this.dropService.delete(id);
    }
}
