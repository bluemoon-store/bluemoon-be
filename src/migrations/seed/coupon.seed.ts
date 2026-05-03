import { Injectable } from '@nestjs/common';
import {
    CouponCategoryScope,
    CouponDiscountType,
    Prisma,
} from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { Command } from 'nestjs-command';

import { DatabaseService } from 'src/common/database/services/database.service';

@Injectable()
export class CouponSeedService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly databaseService: DatabaseService
    ) {
        this.logger.setContext(CouponSeedService.name);
    }

    @Command({
        command: 'seed:coupons',
        describe: 'Seed checkout marketing coupons (run after seed:products)',
    })
    async seed(): Promise<void> {
        this.logger.info('Seeding coupons...');

        const summerExpires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        const categoryRows =
            await this.databaseService.productCategory.findMany({
                where: {
                    deletedAt: null,
                    slug: { in: ['shopping', 'food'] },
                },
                select: { id: true, slug: true },
            });

        if (categoryRows.length === 0) {
            this.logger.warn(
                'No product categories found; run seed:products first. Skipping coupon seed.'
            );
            return;
        }

        const welcome = await this.databaseService.coupon.findFirst({
            where: { code: 'WELCOME10', deletedAt: null },
        });
        if (!welcome) {
            await this.databaseService.coupon.create({
                data: {
                    code: 'WELCOME10',
                    description: '10% off your first purchase',
                    discountType: CouponDiscountType.PERCENT,
                    discountValue: new Prisma.Decimal('10'),
                    categoryScope: CouponCategoryScope.ALL,
                    isActive: true,
                },
            });
            this.logger.info('Created WELCOME10');
        } else {
            this.logger.info('WELCOME10 already exists; skip');
        }

        const five = await this.databaseService.coupon.findFirst({
            where: { code: 'FIVEOFF', deletedAt: null },
        });
        if (!five) {
            await this.databaseService.coupon.create({
                data: {
                    code: 'FIVEOFF',
                    description: '$5 off your order',
                    discountType: CouponDiscountType.FIXED,
                    discountValue: new Prisma.Decimal('5'),
                    categoryScope: CouponCategoryScope.ALL,
                    maxUses: 50,
                    isActive: true,
                },
            });
            this.logger.info('Created FIVEOFF');
        } else {
            this.logger.info('FIVEOFF already exists; skip');
        }

        const summer = await this.databaseService.coupon.findFirst({
            where: { code: 'SUMMER25', deletedAt: null },
        });
        if (!summer) {
            await this.databaseService.coupon.create({
                data: {
                    code: 'SUMMER25',
                    description: '25% off Shopping & Food',
                    discountType: CouponDiscountType.PERCENT,
                    discountValue: new Prisma.Decimal('25'),
                    categoryScope: CouponCategoryScope.SPECIFIC,
                    expiresAt: summerExpires,
                    maxUses: 100,
                    isActive: true,
                    categories: {
                        create: categoryRows.map(c => ({
                            categoryId: c.id,
                        })),
                    },
                },
            });
            this.logger.info('Created SUMMER25');
        } else {
            this.logger.info('SUMMER25 already exists; skip');
        }

        this.logger.info('Coupon seeding finished');
    }
}
