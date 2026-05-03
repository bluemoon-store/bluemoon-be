import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';

import { CouponValidateQueryDto } from '../dtos/request/coupon.validate.request';
import {
    CouponPreviewResponseDto,
    CouponValidateResponseDto,
} from '../dtos/response/coupon.validate.response';
import { CouponService } from '../services/coupon.service';

@ApiTags('public.coupon')
@Controller({
    path: '/coupons',
    version: '1',
})
export class CouponPublicController {
    constructor(private readonly couponService: CouponService) {}

    @Get('validate')
    @PublicRoute()
    @ApiOperation({ summary: 'Validate a coupon for cart/checkout' })
    @DocResponse({
        serialization: CouponValidateResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'coupon.success.validated',
    })
    public async validate(
        @Query() query: CouponValidateQueryDto
    ): Promise<CouponValidateResponseDto> {
        return this.couponService.validate(query.code, query.categoryIds);
    }

    @Get('preview')
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Preview coupon discount for the authenticated user cart',
    })
    @DocResponse({
        serialization: CouponPreviewResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'coupon.success.previewed',
    })
    public async preview(
        @AuthUser() user: IAuthUser,
        @Query() query: CouponValidateQueryDto
    ): Promise<CouponPreviewResponseDto> {
        return this.couponService.previewForUser(user.userId, query.code);
    }
}
