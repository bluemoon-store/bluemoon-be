import { Body, Controller, Get, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogCategory } from '@prisma/client';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import {
    READ_ADMIN_ROLES,
    STAFF_OPERATIONS_ROLES,
} from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { AuditLog } from 'src/modules/activity-log/decorators/audit-log.decorator';

import { SettingsTestEmailValidityRequestDto } from '../dtos/request/settings.test-email-validity.request';
import { SettingsUpdateGeneralRequestDto } from '../dtos/request/settings.update-general.request';
import { SettingsUpdateSocialRequestDto } from '../dtos/request/settings.update-social.request';
import { SettingsEmailValidityTestResponseDto } from '../dtos/response/settings.email-validity-test.response';
import { SettingsGeneralResponseDto } from '../dtos/response/settings.general.response';
import { SettingsSocialResponseDto } from '../dtos/response/settings.social.response';
import { SettingsService } from '../services/settings.service';

@ApiTags('admin.settings')
@Controller({ path: '/admin/settings', version: '1' })
export class SettingsAdminController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get('general')
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get admin general settings' })
    @DocResponse({
        serialization: SettingsGeneralResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'settings.success.generalFound',
    })
    async getGeneral(): Promise<SettingsGeneralResponseDto> {
        return this.settingsService.getGeneral();
    }

    @Put('general')
    @AuditLog({
        action: 'settings.general.update',
        category: ActivityLogCategory.SETTINGS,
        resourceType: 'SystemSettings',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update admin general settings' })
    @DocResponse({
        serialization: SettingsGeneralResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'settings.success.generalUpdated',
    })
    async updateGeneral(
        @Body() payload: SettingsUpdateGeneralRequestDto
    ): Promise<SettingsGeneralResponseDto> {
        return this.settingsService.updateGeneral(payload);
    }

    @Get('social')
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get admin social settings' })
    @DocResponse({
        serialization: SettingsSocialResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'settings.success.socialFound',
    })
    async getSocial(): Promise<SettingsSocialResponseDto> {
        return this.settingsService.getSocial();
    }

    @Put('social')
    @AuditLog({
        action: 'settings.social.update',
        category: ActivityLogCategory.SETTINGS,
        resourceType: 'SystemSettings',
    })
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update admin social settings' })
    @DocResponse({
        serialization: SettingsSocialResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'settings.success.socialUpdated',
    })
    async updateSocial(
        @Body() payload: SettingsUpdateSocialRequestDto
    ): Promise<SettingsSocialResponseDto> {
        return this.settingsService.updateSocial(payload);
    }

    @Post('test-email-validity')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Test external email validity URL' })
    @DocResponse({
        serialization: SettingsEmailValidityTestResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'settings.success.emailValidityTested',
    })
    async testEmailValidity(
        @Body() payload: SettingsTestEmailValidityRequestDto
    ): Promise<SettingsEmailValidityTestResponseDto> {
        return this.settingsService.testEmailValidityUrl(payload.url);
    }
}
