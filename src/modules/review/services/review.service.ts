import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

import { DatabaseService } from 'src/common/database/services/database.service';
import { OrderByInput } from 'src/common/helper/interfaces/pagination.interface';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { CreateReviewDto } from '../dtos/request/review.create.request';
import { AdminReviewListQueryDto } from '../dtos/request/review.admin-list.request';
import {
    ReviewListQueryDto,
    ReviewSort,
} from '../dtos/request/review.list.request';
import { UpdateReviewDto } from '../dtos/request/review.update.request';
import {
    ReviewOrderSummaryDto,
    ReviewResponseDto,
} from '../dtos/response/review.response';

@Injectable()
export class ReviewService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly paginationService: HelperPaginationService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(ReviewService.name);
    }

    private reviewInclude = {
        order: {
            include: {
                items: {
                    include: { product: { select: { name: true } } },
                },
                cryptoPayment: { select: { cryptocurrency: true } },
            },
        },
    } as const;

    private mapOrderSummary(order: {
        totalAmount: Prisma.Decimal | string;
        createdAt: Date;
        cryptoPayment?: { cryptocurrency: string } | null;
        items?: Array<{
            quantity: number;
            product?: { name?: string | null } | null;
        }>;
    }): ReviewOrderSummaryDto {
        const firstItem = order.items?.[0];
        const itemCount = (order.items ?? []).reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        return {
            brand: firstItem?.product?.name ?? 'Order',
            itemCount,
            price:
                typeof order.totalAmount === 'string'
                    ? order.totalAmount
                    : order.totalAmount.toString(),
            date: order.createdAt.toISOString().slice(0, 10),
            time: order.createdAt.toISOString().slice(11, 19),
            paymentMethod: order.cryptoPayment?.cryptocurrency ?? 'UNKNOWN',
        };
    }

    private mapReviewResponse(review: {
        id: string;
        orderId: string;
        rating: number;
        comment: string | null;
        createdAt: Date;
        order: {
            totalAmount: Prisma.Decimal | string;
            createdAt: Date;
            cryptoPayment?: { cryptocurrency: string } | null;
            items?: Array<{
                quantity: number;
                product?: { name?: string | null } | null;
            }>;
        };
    }): ReviewResponseDto {
        return {
            id: review.id,
            orderId: review.orderId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            order: this.mapOrderSummary(review.order),
        };
    }

    private getOrderBySort(sort?: ReviewSort): OrderByInput | OrderByInput[] {
        if (sort === ReviewSort.OLDEST) return { createdAt: 'asc' };
        if (sort === ReviewSort.RATING_HIGH) {
            return [{ rating: 'desc' }, { createdAt: 'desc' }];
        }
        if (sort === ReviewSort.RATING_LOW) {
            return [{ rating: 'asc' }, { createdAt: 'desc' }];
        }
        return { createdAt: 'desc' };
    }

    public async createReview(
        userId: string,
        payload: CreateReviewDto
    ): Promise<ReviewResponseDto> {
        const order = await this.databaseService.order.findFirst({
            where: { id: payload.orderId, userId, deletedAt: null },
            include: { review: true },
        });

        if (!order) {
            throw new HttpException(
                'review.error.orderNotFound',
                HttpStatus.NOT_FOUND
            );
        }
        if (order.status !== OrderStatus.COMPLETED) {
            throw new HttpException(
                'review.error.orderMustBeCompleted',
                HttpStatus.BAD_REQUEST
            );
        }
        if (order.review && !order.review.deletedAt) {
            throw new HttpException(
                'review.error.alreadyReviewed',
                HttpStatus.CONFLICT
            );
        }

        if (order.review?.deletedAt) {
            const restored = await this.databaseService.orderReview.update({
                where: { id: order.review.id },
                data: {
                    userId,
                    rating: payload.rating,
                    comment: payload.comment?.trim() || null,
                    deletedAt: null,
                },
                include: this.reviewInclude,
            });

            return this.mapReviewResponse(restored);
        }

        const created = await this.databaseService.orderReview.create({
            data: {
                orderId: payload.orderId,
                userId,
                rating: payload.rating,
                comment: payload.comment?.trim() || null,
            },
            include: this.reviewInclude,
        });

        return this.mapReviewResponse(created);
    }

    public async listOwnReviews(
        userId: string,
        query: ReviewListQueryDto
    ): Promise<ApiPaginatedDataDto<ReviewResponseDto>> {
        const where: Prisma.OrderReviewWhereInput = {
            userId,
            deletedAt: null,
        };

        const paginated = await this.paginationService.paginate<any>(
            this.databaseService.orderReview,
            { page: query.page ?? 1, limit: query.limit ?? 10 },
            {
                where,
                include: this.reviewInclude,
                orderBy: this.getOrderBySort(query.sort),
            }
        );

        return {
            metadata: paginated.metadata,
            items: paginated.items.map(item => this.mapReviewResponse(item)),
        };
    }

    public async updateOwnReview(
        userId: string,
        reviewId: string,
        payload: UpdateReviewDto
    ): Promise<ReviewResponseDto> {
        const review = await this.databaseService.orderReview.findFirst({
            where: { id: reviewId, userId, deletedAt: null },
        });
        if (!review) {
            throw new HttpException(
                'review.error.notFound',
                HttpStatus.NOT_FOUND
            );
        }

        if (payload.rating === undefined && payload.comment === undefined) {
            throw new HttpException(
                'review.error.noDataToUpdate',
                HttpStatus.BAD_REQUEST
            );
        }

        const updated = await this.databaseService.orderReview.update({
            where: { id: reviewId },
            data: {
                rating: payload.rating ?? review.rating,
                comment:
                    payload.comment !== undefined
                        ? payload.comment?.trim() || null
                        : review.comment,
            },
            include: this.reviewInclude,
        });

        return this.mapReviewResponse(updated);
    }

    public async deleteOwnReview(
        userId: string,
        reviewId: string
    ): Promise<void> {
        const review = await this.databaseService.orderReview.findFirst({
            where: { id: reviewId, userId, deletedAt: null },
            select: { id: true },
        });
        if (!review) {
            throw new HttpException(
                'review.error.notFound',
                HttpStatus.NOT_FOUND
            );
        }

        await this.databaseService.orderReview.update({
            where: { id: reviewId },
            data: { deletedAt: new Date() },
        });
    }

    public async listAdminReviews(
        query: AdminReviewListQueryDto
    ): Promise<ApiPaginatedDataDto<ReviewResponseDto>> {
        const where: Prisma.OrderReviewWhereInput = {
            deletedAt: null,
            ...(query.userId ? { userId: query.userId } : {}),
            ...(query.orderId ? { orderId: query.orderId } : {}),
        };

        const paginated = await this.paginationService.paginate<any>(
            this.databaseService.orderReview,
            { page: query.page ?? 1, limit: query.limit ?? 10 },
            {
                where,
                include: this.reviewInclude,
                orderBy: this.getOrderBySort(query.sort),
            }
        );

        return {
            metadata: paginated.metadata,
            items: paginated.items.map(item => this.mapReviewResponse(item)),
        };
    }

    public async deleteAdminReview(reviewId: string): Promise<void> {
        const review = await this.databaseService.orderReview.findFirst({
            where: { id: reviewId, deletedAt: null },
            select: { id: true },
        });
        if (!review) {
            throw new HttpException(
                'review.error.notFound',
                HttpStatus.NOT_FOUND
            );
        }
        await this.databaseService.orderReview.update({
            where: { id: reviewId },
            data: { deletedAt: new Date() },
        });
    }

    public async listProductReviews(
        productId: string,
        query: Pick<ReviewListQueryDto, 'page' | 'limit' | 'sort'>
    ): Promise<ApiPaginatedDataDto<ReviewResponseDto>> {
        const paginated = await this.paginationService.paginate<any>(
            this.databaseService.orderReview,
            { page: query.page ?? 1, limit: query.limit ?? 10 },
            {
                where: {
                    deletedAt: null,
                    order: {
                        deletedAt: null,
                        items: {
                            some: { productId },
                        },
                    },
                },
                include: this.reviewInclude,
                orderBy: this.getOrderBySort(query.sort),
            }
        );

        return {
            metadata: paginated.metadata,
            items: paginated.items.map(item => this.mapReviewResponse(item)),
        };
    }
}
