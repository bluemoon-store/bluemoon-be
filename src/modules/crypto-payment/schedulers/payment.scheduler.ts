import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';

import { PaymentVerificationProcessor } from '../processors/payment-verification.processor';

/**
 * Singleton holder for crypto-payment cron jobs.
 *
 * PaymentVerificationProcessor transitively depends on a REQUEST-scoped
 * provider (WalletService -> ActivityLogEmitterService), so @nestjs/schedule
 * refuses to register @Cron handlers on it ("non static provider"). This
 * scheduler is a default-scoped singleton, so its @Cron methods register
 * cleanly; each tick resolves a fresh processor instance via ModuleRef.
 */
@Injectable()
export class PaymentScheduler {
    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(PaymentScheduler.name);
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async handlePendingPaymentsCron(): Promise<void> {
        try {
            const processor = await this.moduleRef.resolve(
                PaymentVerificationProcessor
            );
            await processor.handlePendingPaymentsCron();
        } catch (error) {
            this.logger.error(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to execute handlePendingPaymentsCron'
            );
        }
    }

    @Cron('*/5 * * * *')
    async handleExpiredPaymentsCron(): Promise<void> {
        try {
            const processor = await this.moduleRef.resolve(
                PaymentVerificationProcessor
            );
            await processor.handleExpiredPaymentsCron();
        } catch (error) {
            this.logger.error(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to execute handleExpiredPaymentsCron'
            );
        }
    }

    @Cron('*/5 * * * *')
    async handleExpiredWalletTopUpsCron(): Promise<void> {
        try {
            const processor = await this.moduleRef.resolve(
                PaymentVerificationProcessor
            );
            await processor.handleExpiredWalletTopUpsCron();
        } catch (error) {
            this.logger.error(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to execute handleExpiredWalletTopUpsCron'
            );
        }
    }
}
