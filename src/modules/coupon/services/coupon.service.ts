import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
    CouponCategoryScope,
    CouponDiscountType,
    Prisma,
} from '@prisma/client';
import { Cache } from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';

import { DatabaseService } from 'src/common/database/services/database.service';
import { getCommerceLineSubtotal } from 'src/common/utils/commerce.util';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { CouponCreateDto } from '../dtos/request/coupon.create.request';
import {
    CouponListQueryDto,
    CouponListStatusFilter,
} from '../dtos/request/coupon.list.request';
import { CouponUpdateDto } from '../dtos/request/coupon.update.request';
import {
    CouponListResponseDto,
    CouponResponseDto,
} from '../dtos/response/coupon.response';
import {
    CouponInvalidateReason,
    CouponPreviewResponseDto,
    CouponValidateResponseDto,
} from '../dtos/response/coupon.validate.response';
import { CouponWithCategories } from '../interfaces/coupon.interface';
import { calculateCouponDiscount } from '../utils/coupon-discount.util';
import {
    daysRemaining,
    deriveStatus,
    isValidCodeFormat,
    normalizeCode,
} from '../utils/coupon.util';
import { ActivityLogEmitterService } from 'src/modules/activity-log/services/activity-log.emitter.service';

const couponInclude = {
    categories: {
        include: {
            category: {
                select: { id: true, name: true, slug: true },
            },
        },
    },
} satisfies Prisma.CouponInclude;

const VALIDATE_CACHE_MS = 30_000;

@Injectable()
export class CouponService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly paginationService: HelperPaginationService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        private readonly activityLogEmitter: ActivityLogEmitterService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(CouponService.name);
    }

    private mapToResponse(row: CouponWithCategories): CouponResponseDto {
        const categories = row.categories.map(cc => ({
            id: cc.category.id,
            name: cc.category.name,
            slug: cc.category.slug,
        }));

        return {
            id: row.id,
            code: row.code,
            description: row.description ?? null,
            status: deriveStatus(row.expiresAt),
            discountType: row.discountType,
            discountValue: Number(row.discountValue),
            expiresAt: row.expiresAt,
            daysRemaining: daysRemaining(row.expiresAt),
            categoryScope: row.categoryScope,
            categories,
            usedCount: row.usedCount,
            maxUses: row.maxUses,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }

    private toListDto(row: CouponWithCategories): CouponListResponseDto {
        const full = this.mapToResponse(row);
        const { updatedAt: _u, ...rest } = full;
        return rest;
    }

    private assertDiscount(
        discountType: CouponDiscountType,
        value: number
    ): void {
        if (!Number.isFinite(value)) {
            throw new HttpException(
                'coupon.error.invalidDiscount',
                HttpStatus.BAD_REQUEST
            );
        }
        if (discountType === CouponDiscountType.PERCENT) {
            if (value < 1 || value > 100) {
                throw new HttpException(
                    'coupon.error.invalidDiscount',
                    HttpStatus.BAD_REQUEST
                );
            }
        } else if (value <= 0) {
            throw new HttpException(
                'coupon.error.invalidDiscount',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    private async assertCodeUnique(
        normalizedCode: string,
        excludeId?: string
    ): Promise<void> {
        const duplicate = await this.databaseService.coupon.findFirst({
            where: {
                deletedAt: null,
                code: { equals: normalizedCode, mode: 'insensitive' },
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
            select: { id: true },
        });
        if (duplicate) {
            throw new HttpException(
                'coupon.error.codeExists',
                HttpStatus.CONFLICT
            );
        }
    }

    private async assertCategoryIdsExist(ids: string[]): Promise<void> {
        const rows = await this.databaseService.productCategory.findMany({
            where: { id: { in: ids }, deletedAt: null },
            select: { id: true },
        });
        if (rows.length !== ids.length) {
            throw new HttpException(
                'coupon.error.invalidCategories',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async create(payload: CouponCreateDto): Promise<CouponResponseDto> {
        const code = normalizeCode(payload.code);
        if (!isValidCodeFormat(code)) {
            throw new HttpException(
                'coupon.error.invalidCode',
                HttpStatus.BAD_REQUEST
            );
        }

        await this.assertCodeUnique(code);
        this.assertDiscount(payload.discountType, payload.discountValue);

        if (payload.categoryScope === CouponCategoryScope.SPECIFIC) {
            if (!payload.categoryIds?.length) {
                throw new HttpException(
                    'coupon.error.categoriesRequired',
                    HttpStatus.BAD_REQUEST
                );
            }
            await this.assertCategoryIdsExist(payload.categoryIds);
        }

        const expiresAt =
            payload.expiresAt === null || payload.expiresAt === undefined
                ? null
                : new Date(payload.expiresAt);

        try {
            const created = await this.databaseService.$transaction(
                async tx => {
                    const coupon = await tx.coupon.create({
                        data: {
                            code,
                            description: payload.description ?? null,
                            discountType: payload.discountType,
                            discountValue: payload.discountValue,
                            expiresAt,
                            maxUses: payload.maxUses ?? null,
                            categoryScope: payload.categoryScope,
                            isActive: payload.isActive ?? true,
                            ...(payload.categoryScope ===
                                CouponCategoryScope.SPECIFIC &&
                            payload.categoryIds?.length
                                ? {
                                      categories: {
                                          create: payload.categoryIds.map(
                                              categoryId => ({
                                                  categoryId,
                                              })
                                          ),
                                      },
                                  }
                                : {}),
                        },
                    });

                    return tx.coupon.findFirstOrThrow({
                        where: { id: coupon.id },
                        include: couponInclude,
                    });
                }
            );

            return this.mapToResponse(created as CouponWithCategories);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Coupon create failed: ${error.message}`);
            throw new HttpException(
                'coupon.error.createFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private buildListWhere(query: CouponListQueryDto): Prisma.CouponWhereInput {
        const base: Prisma.CouponWhereInput = { deletedAt: null };
        const status = query.status ?? CouponListStatusFilter.ALL;

        let combined: Prisma.CouponWhereInput = { ...base };

        if (status === CouponListStatusFilter.ACTIVE) {
            combined = {
                ...base,
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            };
        } else if (status === CouponListStatusFilter.EXPIRED) {
            combined = {
                ...base,
                expiresAt: { not: null, lte: new Date() },
            };
        }

        if (query.query?.trim()) {
            combined = {
                AND: [
                    combined,
                    {
                        code: {
                            contains: query.query.trim(),
                            mode: 'insensitive',
                        },
                    },
                ],
            };
        }

        return combined;
    }

    async findAll(
        query: CouponListQueryDto
    ): Promise<ApiPaginatedDataDto<CouponListResponseDto>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 12;
        const where = this.buildListWhere(query);

        const result =
            await this.paginationService.paginate<CouponWithCategories>(
                this.databaseService.coupon,
                { page, limit },
                {
                    where,
                    include: couponInclude,
                    orderBy: { createdAt: 'desc' },
                }
            );

        return {
            metadata: result.metadata,
            items: result.items.map(row => this.toListDto(row)),
        };
    }

    async findOne(id: string): Promise<CouponResponseDto> {
        const row = await this.databaseService.coupon.findFirst({
            where: { id, deletedAt: null },
            include: couponInclude,
        });
        if (!row) {
            throw new HttpException(
                'coupon.error.notFound',
                HttpStatus.NOT_FOUND
            );
        }
        return this.mapToResponse(row as CouponWithCategories);
    }

    async update(id: string, dto: CouponUpdateDto): Promise<CouponResponseDto> {
        const existing = await this.databaseService.coupon.findFirst({
            where: { id, deletedAt: null },
            include: couponInclude,
        });
        if (!existing) {
            throw new HttpException(
                'coupon.error.notFound',
                HttpStatus.NOT_FOUND
            );
        }

        const nextCode =
            dto.code !== undefined ? normalizeCode(dto.code) : existing.code;
        if (dto.code !== undefined) {
            if (!isValidCodeFormat(nextCode)) {
                throw new HttpException(
                    'coupon.error.invalidCode',
                    HttpStatus.BAD_REQUEST
                );
            }
            await this.assertCodeUnique(nextCode, id);
        }

        const discountType = dto.discountType ?? existing.discountType;
        const discountValue =
            dto.discountValue ?? Number(existing.discountValue);
        this.assertDiscount(discountType, discountValue);

        const expiresAt =
            dto.expiresAt !== undefined
                ? dto.expiresAt === null
                    ? null
                    : new Date(dto.expiresAt)
                : existing.expiresAt;

        if (dto.categoryScope === CouponCategoryScope.SPECIFIC) {
            if (!dto.categoryIds?.length) {
                throw new HttpException(
                    'coupon.error.categoriesRequired',
                    HttpStatus.BAD_REQUEST
                );
            }
            await this.assertCategoryIdsExist(dto.categoryIds);
        }

        try {
            const updated = await this.databaseService.$transaction(
                async tx => {
                    await tx.coupon.update({
                        where: { id },
                        data: {
                            ...(dto.code !== undefined
                                ? { code: nextCode }
                                : {}),
                            ...(dto.discountType !== undefined
                                ? { discountType: dto.discountType }
                                : {}),
                            ...(dto.discountValue !== undefined
                                ? { discountValue: dto.discountValue }
                                : {}),
                            ...(dto.expiresAt !== undefined
                                ? { expiresAt }
                                : {}),
                            ...(dto.maxUses !== undefined
                                ? { maxUses: dto.maxUses }
                                : {}),
                            ...(dto.categoryScope !== undefined
                                ? { categoryScope: dto.categoryScope }
                                : {}),
                            ...(dto.isActive !== undefined
                                ? { isActive: dto.isActive }
                                : {}),
                            ...(dto.description !== undefined
                                ? { description: dto.description }
                                : {}),
                        },
                    });

                    if (dto.categoryScope === CouponCategoryScope.ALL) {
                        await tx.couponCategory.deleteMany({
                            where: { couponId: id },
                        });
                    } else if (
                        dto.categoryScope === CouponCategoryScope.SPECIFIC &&
                        dto.categoryIds?.length
                    ) {
                        await tx.couponCategory.deleteMany({
                            where: { couponId: id },
                        });
                        await tx.couponCategory.createMany({
                            data: dto.categoryIds.map(categoryId => ({
                                couponId: id,
                                categoryId,
                            })),
                        });
                    }

                    return tx.coupon.findFirstOrThrow({
                        where: { id },
                        include: couponInclude,
                    });
                }
            );

            return this.mapToResponse(updated as CouponWithCategories);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Coupon update failed: ${error.message}`);
            throw new HttpException(
                'coupon.error.updateFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async delete(id: string): Promise<ApiGenericResponseDto> {
        await this.findOne(id);
        await this.databaseService.coupon.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return {
            success: true,
            message: 'coupon.success.deleted',
        };
    }

    async toggleActive(id: string): Promise<CouponResponseDto> {
        const existing = await this.databaseService.coupon.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing) {
            throw new HttpException(
                'coupon.error.notFound',
                HttpStatus.NOT_FOUND
            );
        }

        this.activityLogEmitter.captureBefore({
            before: { isActive: existing.isActive },
        });

        await this.databaseService.coupon.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });

        const updated = await this.findOne(id);

        this.activityLogEmitter.captureAfter({
            after: { isActive: updated.isActive },
            resourceLabel: updated.code,
        });

        return updated;
    }

    private buildValidateCacheKey(
        code: string,
        categoryIds?: string[]
    ): string {
        const sorted = [...(categoryIds ?? [])].sort().join(',');
        return `coupon:validate:${code}:${sorted}`;
    }

    private getCouponInvalidateReason(
        coupon: {
            isActive: boolean;
            expiresAt: Date | null;
            maxUses: number | null;
            usedCount: number;
            categoryScope: CouponCategoryScope;
            categories: { categoryId: string }[];
        },
        categoryIds?: string[]
    ): CouponInvalidateReason | null {
        if (!coupon.isActive) {
            return 'INACTIVE';
        }
        if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
            return 'EXPIRED';
        }
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return 'EXHAUSTED';
        }
        if (coupon.categoryScope === CouponCategoryScope.SPECIFIC) {
            const cartIds = categoryIds ?? [];
            const allowed = new Set(coupon.categories.map(c => c.categoryId));
            const intersects = cartIds.some(cid => allowed.has(cid));
            if (!intersects) {
                return 'CATEGORY_MISMATCH';
            }
        }
        return null;
    }

    private couponReasonToErrorKey(reason: CouponInvalidateReason): string {
        const keys: Record<CouponInvalidateReason, string> = {
            NOT_FOUND: 'coupon.error.notFound',
            EXPIRED: 'coupon.error.expired',
            INACTIVE: 'coupon.error.inactive',
            EXHAUSTED: 'coupon.error.exhausted',
            CATEGORY_MISMATCH: 'coupon.error.categoryMismatch',
            CART_EMPTY: 'coupon.error.cartEmpty',
        };
        return keys[reason];
    }

    async validate(
        codeRaw: string,
        categoryIds?: string[]
    ): Promise<CouponValidateResponseDto> {
        const code = normalizeCode(codeRaw);
        if (!code) {
            const negative: CouponValidateResponseDto = {
                valid: false,
                reason: 'NOT_FOUND',
            };
            return negative;
        }

        const cacheKey = this.buildValidateCacheKey(code, categoryIds);
        const cached =
            await this.cacheManager.get<CouponValidateResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const coupon = await this.databaseService.coupon.findFirst({
            where: {
                deletedAt: null,
                code: { equals: code, mode: 'insensitive' },
            },
            include: {
                categories: { select: { categoryId: true } },
            },
        });

        if (!coupon) {
            const out: CouponValidateResponseDto = {
                valid: false,
                reason: 'NOT_FOUND',
            };
            await this.cacheManager.set(cacheKey, out, VALIDATE_CACHE_MS);
            return out;
        }

        const reason = this.getCouponInvalidateReason(coupon, categoryIds);

        if (reason) {
            const out: CouponValidateResponseDto = {
                valid: false,
                reason,
            };
            await this.cacheManager.set(cacheKey, out, VALIDATE_CACHE_MS);
            return out;
        }

        const success: CouponValidateResponseDto = {
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            categoryScope: coupon.categoryScope,
            categoryIds: coupon.categories.map(c => c.categoryId),
        };
        await this.cacheManager.set(cacheKey, success, VALIDATE_CACHE_MS);
        return success;
    }

    /**
     * Auth-only preview: validates against the user's cart and returns discount math.
     * Does not cache the full response (cart changes often); validate() metadata remains cached.
     */
    async previewForUser(
        userId: string,
        codeRaw: string
    ): Promise<CouponPreviewResponseDto> {
        const zeroDisc = '0.00000000';
        const cart = await this.databaseService.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                categoryId: true,
                                price: true,
                                currency: true,
                            },
                        },
                    },
                },
            },
        });

        if (!cart?.items?.length) {
            return {
                valid: false,
                reason: 'CART_EMPTY',
                discountAmount: zeroDisc,
            };
        }

        const categoryIds = [
            ...new Set(cart.items.map(i => i.product.categoryId)),
        ];
        const meta = await this.validate(codeRaw, categoryIds);
        if (!meta.valid) {
            return {
                ...meta,
                discountAmount: zeroDisc,
            };
        }

        const couponRow = await this.databaseService.coupon.findFirst({
            where: {
                deletedAt: null,
                code: {
                    equals: normalizeCode(codeRaw),
                    mode: 'insensitive',
                },
            },
            include: {
                categories: { select: { categoryId: true } },
            },
        });

        if (!couponRow || !meta.code) {
            return {
                valid: false,
                reason: 'NOT_FOUND',
                discountAmount: zeroDisc,
            };
        }

        const lineItems = cart.items.map(ci => ({
            categoryId: ci.product.categoryId,
            lineSubtotal: getCommerceLineSubtotal(ci),
        }));

        const calc = calculateCouponDiscount(
            {
                discountType: couponRow.discountType,
                discountValue: couponRow.discountValue,
                categoryScope: couponRow.categoryScope,
                categoryIds: couponRow.categories.map(c => c.categoryId),
            },
            lineItems
        );

        return {
            ...meta,
            subtotal: calc.subtotal.toFixed(8),
            applicableSubtotal: calc.applicableSubtotal.toFixed(8),
            discountAmount: calc.discountAmount.toFixed(8),
            description: couponRow.description ?? null,
        };
    }

    /**
     * Loads coupon from DB (no validate cache) and throws if not applicable to the cart categories.
     * Used at order creation so pricing stays server-authoritative.
     */
    async findActiveByCode(
        codeRaw: string,
        cartCategoryIds: string[]
    ): Promise<CouponWithCategories> {
        const code = normalizeCode(codeRaw);
        if (!code) {
            throw new HttpException(
                'coupon.error.notFound',
                HttpStatus.BAD_REQUEST
            );
        }

        const coupon = await this.databaseService.coupon.findFirst({
            where: {
                deletedAt: null,
                code: { equals: code, mode: 'insensitive' },
            },
            include: couponInclude,
        });

        if (!coupon) {
            throw new HttpException(
                'coupon.error.notFound',
                HttpStatus.BAD_REQUEST
            );
        }

        const minimal = {
            isActive: coupon.isActive,
            expiresAt: coupon.expiresAt,
            maxUses: coupon.maxUses,
            usedCount: coupon.usedCount,
            categoryScope: coupon.categoryScope,
            categories: coupon.categories.map(cc => ({
                categoryId: cc.categoryId,
            })),
        };
        const reason = this.getCouponInvalidateReason(minimal, cartCategoryIds);
        if (reason) {
            throw new HttpException(
                this.couponReasonToErrorKey(reason),
                HttpStatus.BAD_REQUEST
            );
        }

        return coupon as CouponWithCategories;
    }
}
