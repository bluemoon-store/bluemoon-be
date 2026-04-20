import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { ReviewListQueryDto } from '../dtos/request/review.list.request';
import { ReviewResponseDto } from '../dtos/response/review.response';
import { ReviewService } from '../services/review.service';

@ApiTags('public.review')
@Controller({
    path: '/products',
    version: '1',
})
export class ReviewPublicController {
    constructor(private readonly reviewService: ReviewService) {}

    @Get(':id/reviews')
    @PublicRoute()
    @ApiOperation({ summary: 'Get reviews for product' })
    @DocPaginatedResponse({
        serialization: ReviewResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'review.success.list',
    })
    public async listProductReviews(
        @Param('id') productId: string,
        @Query(new QueryTransformPipe())
        query: Pick<ReviewListQueryDto, 'page' | 'limit' | 'sort'>
    ): Promise<ApiPaginatedDataDto<ReviewResponseDto>> {
        return this.reviewService.listProductReviews(productId, query);
    }
}
