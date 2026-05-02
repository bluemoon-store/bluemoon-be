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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { CouponCreateDto } from '../dtos/request/coupon.create.request';
import { CouponListQueryDto } from '../dtos/request/coupon.list.request';
import { CouponUpdateDto } from '../dtos/request/coupon.update.request';
import {
    CouponListResponseDto,
    CouponResponseDto,
} from '../dtos/response/coupon.response';
import { CouponService } from '../services/coupon.service';

@ApiTags('admin.coupon')
@Controller({
    path: '/admin/coupons',
    version: '1',
})
export class CouponAdminController {
    constructor(private readonly couponService: CouponService) {}

    @Post()
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create coupon' })
    @DocResponse({
        serialization: CouponResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'coupon.success.created',
    })
    public async create(
        @Body() payload: CouponCreateDto
    ): Promise<CouponResponseDto> {
        return this.couponService.create(payload);
    }

    @Get()
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List coupons' })
    @DocPaginatedResponse({
        serialization: CouponListResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'coupon.success.list',
    })
    public async list(
        @Query(new QueryTransformPipe()) query: CouponListQueryDto
    ): Promise<ApiPaginatedDataDto<CouponListResponseDto>> {
        return this.couponService.findAll(query);
    }

    @Get(':id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get coupon by ID' })
    @DocResponse({
        serialization: CouponResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'coupon.success.found',
    })
    public async getById(@Param('id') id: string): Promise<CouponResponseDto> {
        return this.couponService.findOne(id);
    }

    @Put(':id/toggle-active')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Toggle coupon active flag' })
    @DocResponse({
        serialization: CouponResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'coupon.success.updated',
    })
    public async toggleActive(
        @Param('id') id: string
    ): Promise<CouponResponseDto> {
        return this.couponService.toggleActive(id);
    }

    @Put(':id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update coupon' })
    @DocResponse({
        serialization: CouponResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'coupon.success.updated',
    })
    public async update(
        @Param('id') id: string,
        @Body() payload: CouponUpdateDto
    ): Promise<CouponResponseDto> {
        return this.couponService.update(id, payload);
    }

    @Delete(':id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Soft-delete coupon' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'coupon.success.deleted',
    })
    public async delete(
        @Param('id') id: string
    ): Promise<ApiGenericResponseDto> {
        return this.couponService.delete(id);
    }
}
