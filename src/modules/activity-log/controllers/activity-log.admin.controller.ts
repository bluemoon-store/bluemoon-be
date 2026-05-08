import {
    Controller,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
    Res,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiProduces,
    ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Role } from '@prisma/client';

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';

import {
    ActivityLogActorsQueryDto,
    ActivityLogQueryDto,
} from '../dtos/request/activity-log-query.dto';
import {
    ActivityLogListResponseDto,
    ActivityLogResponseDto,
} from '../dtos/response/activity-log.response.dto';
import { ActivityLogService } from '../services/activity-log.service';

@ApiTags('admin.activity-log')
@Controller({
    path: '/admin/activity-logs',
    version: '1',
})
export class ActivityLogAdminController {
    constructor(private readonly activityLogService: ActivityLogService) {}

    @Get()
    @AllowedRoles([Role.OWNER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List activity logs (cursor pagination)' })
    @DocResponse({
        serialization: ActivityLogListResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'activity-log.success.list',
    })
    public async list(
        @Query(new QueryTransformPipe()) query: ActivityLogQueryDto
    ): Promise<ActivityLogListResponseDto> {
        const { items, nextCursor } =
            await this.activityLogService.findMany(query);
        return {
            items: items.map(row =>
                plainToInstance(ActivityLogResponseDto, row, {
                    excludeExtraneousValues: true,
                })
            ),
            nextCursor,
        };
    }

    @Get('export')
    @AllowedRoles([Role.OWNER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Export activity logs as CSV (owner only)' })
    @ApiProduces('text/csv')
    public async export(
        @Query(new QueryTransformPipe()) query: ActivityLogQueryDto,
        @Res() res: Response
    ): Promise<void> {
        await this.activityLogService.streamExportCsv(query, res);
    }

    @Get('actors')
    @AllowedRoles([Role.OWNER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Distinct actors for filter dropdown (cached)' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'activity-log.success.actors',
    })
    public async actors(
        @Query(new QueryTransformPipe()) _query: ActivityLogActorsQueryDto
    ) {
        return this.activityLogService.listActors(_query);
    }

    @Get(':id')
    @AllowedRoles([Role.OWNER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get single activity log entry' })
    @DocResponse({
        serialization: ActivityLogResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'activity-log.success.detail',
    })
    public async getById(
        @Param('id') id: string
    ): Promise<ActivityLogResponseDto> {
        const row = await this.activityLogService.findById(id);
        if (!row) {
            throw new NotFoundException('activityLog.error.notFound');
        }
        return plainToInstance(ActivityLogResponseDto, row, {
            excludeExtraneousValues: true,
        });
    }
}
