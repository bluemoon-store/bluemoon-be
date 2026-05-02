import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogCategory } from '@prisma/client';

import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';

import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { AdminReviewListQueryDto } from '../dtos/request/review.admin-list.request';
import { ReviewResponseDto } from '../dtos/response/review.response';
import { ReviewService } from '../services/review.service';
import { AuditLog } from 'src/modules/activity-log/decorators/audit-log.decorator';

@ApiTags('admin.review')
@Controller({
    path: '/admin/reviews',
    version: '1',
})
export class ReviewAdminController {
    constructor(private readonly reviewService: ReviewService) {}

    @Get()
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List all reviews (admin)' })
    @DocPaginatedResponse({
        serialization: ReviewResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'review.success.list',
    })
    public async list(
        @Query(new QueryTransformPipe()) query: AdminReviewListQueryDto
    ): Promise<ApiPaginatedDataDto<ReviewResponseDto>> {
        return this.reviewService.listAdminReviews(query);
    }

    @Delete(':id')
    @AuditLog({
        action: 'review.delete',
        category: ActivityLogCategory.REVIEW,
        resourceType: 'OrderReview',
        resourceIdParam: 'id',
    })
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete review (admin soft delete)' })
    @HttpCode(HttpStatus.NO_CONTENT)
    public async delete(@Param('id') reviewId: string): Promise<void> {
        await this.reviewService.deleteAdminReview(reviewId);
    }
}
