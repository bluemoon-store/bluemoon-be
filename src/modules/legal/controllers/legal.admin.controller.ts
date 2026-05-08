import { Body, Controller, Get, HttpStatus, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogCategory } from '@prisma/client';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import {
    READ_ADMIN_ROLES,
    STAFF_OPERATIONS_ROLES,
} from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { AuditLog } from 'src/modules/activity-log/decorators/audit-log.decorator';

import { LegalUpdateRequestDto } from '../dtos/request/legal.update.request';
import { LegalResponseDto } from '../dtos/response/legal.response';
import { LegalService, LegalType } from '../services/legal.service';

@ApiTags('admin.legal')
@Controller({ path: '/admin/legal', version: '1' })
export class LegalAdminController {
    constructor(private readonly legalService: LegalService) {}

    @Get()
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List legal documents' })
    @DocResponse({
        serialization: LegalResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'legal.success.list',
    })
    async list(): Promise<LegalResponseDto[]> {
        return this.legalService.list();
    }

    @Get(':type')
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get legal document by type' })
    @DocResponse({
        serialization: LegalResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'legal.success.found',
    })
    async getOne(@Param('type') type: LegalType): Promise<LegalResponseDto> {
        return this.legalService.getOne(type);
    }

    @Put(':type')
    @AuditLog({
        action: 'legal.update',
        category: ActivityLogCategory.CONTENT,
        resourceType: 'CmsContent',
        resourceIdParam: 'type',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Upsert legal document by type' })
    @DocResponse({
        serialization: LegalResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'legal.success.updated',
    })
    async update(
        @Param('type') type: LegalType,
        @Body() payload: LegalUpdateRequestDto
    ): Promise<LegalResponseDto> {
        return this.legalService.update(type, payload);
    }
}
