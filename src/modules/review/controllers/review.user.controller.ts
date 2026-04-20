import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { CreateReviewDto } from '../dtos/request/review.create.request';
import { ReviewListQueryDto } from '../dtos/request/review.list.request';
import { UpdateReviewDto } from '../dtos/request/review.update.request';
import { ReviewResponseDto } from '../dtos/response/review.response';
import { ReviewService } from '../services/review.service';

@ApiTags('public.review')
@Controller({
    path: '/reviews',
    version: '1',
})
export class ReviewUserController {
    constructor(private readonly reviewService: ReviewService) {}

    @Post()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create review for a completed order' })
    @DocResponse({
        serialization: ReviewResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'review.success.created',
    })
    public async create(
        @AuthUser() user: IAuthUser,
        @Body() payload: CreateReviewDto
    ): Promise<ReviewResponseDto> {
        return this.reviewService.createReview(user.userId, payload);
    }

    @Get()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List current user reviews' })
    @DocPaginatedResponse({
        serialization: ReviewResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'review.success.list',
    })
    public async list(
        @AuthUser() user: IAuthUser,
        @Query(new QueryTransformPipe()) query: ReviewListQueryDto
    ): Promise<ApiPaginatedDataDto<ReviewResponseDto>> {
        return this.reviewService.listOwnReviews(user.userId, query);
    }

    @Put(':id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update own review' })
    @DocResponse({
        serialization: ReviewResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'review.success.updated',
    })
    public async update(
        @AuthUser() user: IAuthUser,
        @Param('id') reviewId: string,
        @Body() payload: UpdateReviewDto
    ): Promise<ReviewResponseDto> {
        return this.reviewService.updateOwnReview(
            user.userId,
            reviewId,
            payload
        );
    }

    @Delete(':id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete own review (soft delete)' })
    @HttpCode(HttpStatus.NO_CONTENT)
    public async delete(
        @AuthUser() user: IAuthUser,
        @Param('id') reviewId: string
    ): Promise<void> {
        await this.reviewService.deleteOwnReview(user.userId, reviewId);
    }
}
