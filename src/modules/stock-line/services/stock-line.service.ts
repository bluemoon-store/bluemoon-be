import {
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, StockLineStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

import { DatabaseService } from 'src/common/database/services/database.service';

import { hashStockLineContent } from '../utils/stock-line-hash.util';
import { StockLineListQueryDto } from '../dtos/request/stock-line.list.query';
import {
    StockLineAdminRowDto,
    StockLineBulkAddResponseDto,
    StockLineListResponseDto,
} from '../dtos/response/stock-line.admin.response';
import { StockLineSummaryResponseDto } from '../dtos/response/stock-line.summary.response';

export type DbTx = Prisma.TransactionClient;

/** Prisma root client or interactive transaction client */
export type DbClient = DatabaseService | DbTx;

@Injectable()
export class StockLineService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(StockLineService.name);
    }

    /** Mirrors default crypto checkout window until payment record exists. */
    getDefaultReservationDeadline(): Date {
        const minutes = this.configService.get<number>(
            'crypto.payment.expirationMinutes',
            15
        );
        return new Date(Date.now() + minutes * 60 * 1000);
    }

    private async assertVariantBelongsToProduct(
        tx: DbClient,
        productId: string,
        variantId: string
    ): Promise<void> {
        const v = await tx.productVariant.findFirst({
            where: { id: variantId, productId, deletedAt: null },
        });
        if (!v) {
            throw new NotFoundException('product.error.variantNotFound');
        }
    }

    private async syncVariantAvailableCount(
        tx: DbTx,
        variantId: string
    ): Promise<void> {
        const available = await tx.productStockLine.count({
            where: { variantId, status: StockLineStatus.AVAILABLE },
        });
        await tx.productVariant.update({
            where: { id: variantId },
            data: { stockQuantity: available },
        });
    }

    private async getSummaryCounts(
        tx: DbClient,
        variantId: string
    ): Promise<StockLineSummaryResponseDto> {
        const [available, reserved, sold, refunded] = await Promise.all([
            tx.productStockLine.count({
                where: { variantId, status: StockLineStatus.AVAILABLE },
            }),
            tx.productStockLine.count({
                where: { variantId, status: StockLineStatus.RESERVED },
            }),
            tx.productStockLine.count({
                where: { variantId, status: StockLineStatus.SOLD },
            }),
            tx.productStockLine.count({
                where: { variantId, status: StockLineStatus.REFUNDED },
            }),
        ]);
        const total = available + reserved + sold + refunded;
        return { available, reserved, sold, refunded, total };
    }

    async bulkAddLines(
        productId: string,
        variantId: string,
        lines: string[]
    ): Promise<StockLineBulkAddResponseDto> {
        return this.databaseService.$transaction(async tx => {
            await this.assertVariantBelongsToProduct(tx, productId, variantId);

            const rows: { content: string; contentHash: string }[] = [];
            const seen = new Set<string>();
            let skippedInInput = 0;
            for (const raw of lines) {
                const c = raw.trim();
                if (!c) {
                    continue;
                }
                const contentHash = hashStockLineContent(c);
                if (seen.has(contentHash)) {
                    skippedInInput++;
                    continue;
                }
                seen.add(contentHash);
                rows.push({ content: c, contentHash });
            }

            if (rows.length === 0) {
                const totals = await this.getSummaryCounts(tx, variantId);
                return { added: 0, skipped: skippedInInput, totals };
            }

            const { count: added } = await tx.productStockLine.createMany({
                data: rows.map(r => ({
                    variantId,
                    content: r.content,
                    contentHash: r.contentHash,
                    status: StockLineStatus.AVAILABLE,
                })),
                skipDuplicates: true,
            });

            await this.syncVariantAvailableCount(tx, variantId);
            const totals = await this.getSummaryCounts(tx, variantId);
            const skipped = rows.length - added + skippedInInput;

            return { added, skipped, totals };
        });
    }

    async listLines(
        productId: string,
        variantId: string,
        query: StockLineListQueryDto
    ): Promise<StockLineListResponseDto> {
        await this.assertVariantBelongsToProduct(
            this.databaseService,
            productId,
            variantId
        );

        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductStockLineWhereInput = {
            variantId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.search?.trim()
                ? {
                      content: {
                          contains: query.search.trim(),
                          mode: 'insensitive',
                      },
                  }
                : {}),
        };

        const [items, total] = await Promise.all([
            this.databaseService.productStockLine.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    content: true,
                    status: true,
                    orderItemId: true,
                    reservedUntil: true,
                    createdAt: true,
                },
            }),
            this.databaseService.productStockLine.count({ where }),
        ]);

        return {
            items: items as StockLineAdminRowDto[],
            total,
            page,
            limit,
        };
    }

    async deleteAvailableLine(
        productId: string,
        variantId: string,
        lineId: string
    ): Promise<void> {
        await this.databaseService.$transaction(async tx => {
            await this.assertVariantBelongsToProduct(tx, productId, variantId);

            const line = await tx.productStockLine.findFirst({
                where: { id: lineId, variantId },
            });
            if (!line) {
                throw new NotFoundException('stockLine.error.notFound');
            }
            if (line.status !== StockLineStatus.AVAILABLE) {
                throw new HttpException(
                    'stockLine.error.onlyAvailableDeletable',
                    HttpStatus.BAD_REQUEST
                );
            }
            await tx.productStockLine.delete({ where: { id: lineId } });
            await this.syncVariantAvailableCount(tx, variantId);
        });
    }

    async clearAvailable(productId: string, variantId: string): Promise<void> {
        await this.databaseService.$transaction(async tx => {
            await this.assertVariantBelongsToProduct(tx, productId, variantId);
            await tx.productStockLine.deleteMany({
                where: {
                    variantId,
                    status: StockLineStatus.AVAILABLE,
                },
            });
            await this.syncVariantAvailableCount(tx, variantId);
        });
    }

    async getSummary(
        productId: string,
        variantId: string
    ): Promise<StockLineSummaryResponseDto> {
        await this.assertVariantBelongsToProduct(
            this.databaseService,
            productId,
            variantId
        );
        return this.getSummaryCounts(this.databaseService, variantId);
    }

    private async lockVariantRow(tx: DbTx, variantId: string): Promise<void> {
        await tx.$executeRawUnsafe(
            `SELECT id FROM "product_variants" WHERE id = $1::uuid FOR UPDATE`,
            variantId
        );
    }

    /**
     * Reserves up to `quantity` AVAILABLE lines for the order item, or uses legacy
     * counter-only decrement when the pool is empty but the counter is positive.
     */
    async allocateForOrderItem(
        tx: DbTx,
        orderItemId: string,
        variantId: string,
        quantity: number,
        reservedUntil: Date
    ): Promise<void> {
        await this.lockVariantRow(tx, variantId);

        const variant = await tx.productVariant.findUniqueOrThrow({
            where: { id: variantId },
        });

        const availableCount = await tx.productStockLine.count({
            where: { variantId, status: StockLineStatus.AVAILABLE },
        });

        if (availableCount >= quantity) {
            const picked = await tx.productStockLine.findMany({
                where: { variantId, status: StockLineStatus.AVAILABLE },
                orderBy: { createdAt: 'asc' },
                take: quantity,
                select: { id: true },
            });
            if (picked.length < quantity) {
                throw new HttpException(
                    'order.error.insufficientStock',
                    HttpStatus.BAD_REQUEST
                );
            }
            const now = new Date();
            await tx.productStockLine.updateMany({
                where: { id: { in: picked.map(p => p.id) } },
                data: {
                    status: StockLineStatus.RESERVED,
                    orderItemId,
                    reservedAt: now,
                    reservedUntil,
                },
            });
            await tx.productVariant.update({
                where: { id: variantId },
                data: { stockQuantity: { decrement: quantity } },
            });
            return;
        }

        if (availableCount === 0 && variant.stockQuantity >= quantity) {
            this.logger.warn(
                {
                    variantId,
                    orderItemId,
                    stockQuantity: variant.stockQuantity,
                },
                'Variant has no AVAILABLE stock lines but positive counter; legacy decrement only'
            );
            await tx.productVariant.update({
                where: { id: variantId },
                data: { stockQuantity: { decrement: quantity } },
            });
            return;
        }

        throw new HttpException(
            'order.error.insufficientStock',
            HttpStatus.BAD_REQUEST
        );
    }

    async markSold(tx: DbTx, orderItemId: string): Promise<void> {
        await tx.productStockLine.updateMany({
            where: {
                orderItemId,
                status: StockLineStatus.RESERVED,
            },
            data: {
                status: StockLineStatus.SOLD,
                soldAt: new Date(),
            },
        });
    }

    async markSoldForOrder(tx: DbTx, orderId: string): Promise<void> {
        const items = await tx.orderItem.findMany({
            where: { orderId },
            select: { id: true },
        });
        for (const it of items) {
            await this.markSold(tx, it.id);
        }
    }

    async releaseForOrderItem(tx: DbTx, orderItemId: string): Promise<void> {
        const lines = await tx.productStockLine.findMany({
            where: {
                orderItemId,
                status: StockLineStatus.RESERVED,
            },
            select: { id: true, variantId: true },
        });
        if (lines.length === 0) {
            return;
        }
        const variantId = lines[0].variantId;
        const n = lines.length;

        await tx.productStockLine.updateMany({
            where: {
                orderItemId,
                status: StockLineStatus.RESERVED,
            },
            data: {
                status: StockLineStatus.AVAILABLE,
                orderItemId: null,
                reservedAt: null,
                reservedUntil: null,
            },
        });

        await tx.productVariant.update({
            where: { id: variantId },
            data: { stockQuantity: { increment: n } },
        });
    }

    async releaseReservedForOrder(tx: DbTx, orderId: string): Promise<void> {
        const items = await tx.orderItem.findMany({
            where: { orderId },
            select: { id: true },
        });
        for (const it of items) {
            await this.releaseForOrderItem(tx, it.id);
        }
    }

    /** Undo checkout reservation for a cancelled PENDING order line. */
    async restoreCancelledOrderItem(
        tx: DbTx,
        item: {
            id: string;
            variantId: string | null;
            productId: string;
            quantity: number;
        }
    ): Promise<void> {
        const reserved = await tx.productStockLine.count({
            where: {
                orderItemId: item.id,
                status: StockLineStatus.RESERVED,
            },
        });
        if (reserved > 0) {
            await this.releaseForOrderItem(tx, item.id);
            return;
        }
        if (item.variantId) {
            await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                    stockQuantity: { increment: item.quantity },
                },
            });
        } else {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: { increment: item.quantity },
                },
            });
        }
    }

    async retireForOrderItem(tx: DbTx, orderItemId: string): Promise<void> {
        await tx.productStockLine.updateMany({
            where: {
                orderItemId,
                status: StockLineStatus.SOLD,
            },
            data: {
                status: StockLineStatus.REFUNDED,
                retiredAt: new Date(),
            },
        });
    }

    async syncReservationExpiryForOrder(
        tx: DbClient,
        orderId: string,
        reservedUntil: Date
    ): Promise<void> {
        const itemIds = (
            await tx.orderItem.findMany({
                where: { orderId },
                select: { id: true },
            })
        ).map(i => i.id);
        if (itemIds.length === 0) {
            return;
        }
        await tx.productStockLine.updateMany({
            where: {
                orderItemId: { in: itemIds },
                status: StockLineStatus.RESERVED,
            },
            data: { reservedUntil },
        });
    }

    async releaseAllStaleReservedLines(): Promise<number> {
        const rows = await this.databaseService.productStockLine.findMany({
            where: {
                status: StockLineStatus.RESERVED,
                reservedUntil: { lt: new Date() },
                orderItemId: { not: null },
            },
            select: { orderItemId: true },
        });
        const orderItemIds = [
            ...new Set(
                rows
                    .map(r => r.orderItemId)
                    .filter((id): id is string => Boolean(id))
            ),
        ];

        let released = 0;
        const now = new Date();
        for (const orderItemId of orderItemIds) {
            const didRelease = await this.databaseService.$transaction(
                async tx => {
                    const before = await tx.productStockLine.count({
                        where: {
                            orderItemId,
                            status: StockLineStatus.RESERVED,
                            reservedUntil: { lt: now },
                        },
                    });
                    if (before === 0) {
                        return false;
                    }
                    await this.releaseForOrderItem(tx, orderItemId);
                    return true;
                }
            );
            if (didRelease) {
                released++;
            }
        }
        return released;
    }
}
