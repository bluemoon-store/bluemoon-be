import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PaymentStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { BlockchainMonitorService } from '../services/blockchain-monitor.service';
import { CryptoPaymentService } from '../services/crypto-payment.service';
import { WalletService } from 'src/modules/wallet/services/wallet.service';

/**
 * Payment Verification Job Data Types
 */
interface VerifyPaymentJobData {
    paymentId: string;
    orderId?: string;
}

interface CheckConfirmationsJobData {
    paymentId: string;
}

interface VerifyTopUpJobData {
    topUpId: string;
}

interface CheckTopUpConfirmationsJobData {
    topUpId: string;
}

interface ExpirePaymentJobData {
    paymentId: string;
}

/**
 * Payment Verification Processor
 * Handles background jobs for payment verification and monitoring
 *
 * Job Types:
 * - verify-payment: Check if payment has been received on blockchain
 * - check-confirmations: Monitor transaction confirmations
 * - expire-payment: Handle expired payments
 *
 * Scheduled Tasks:
 * - Every minute: Check all pending payments and pending wallet top-ups
 * - Every 5 minutes: Expire stale pending payments and wallet top-ups
 */
@Processor('crypto-payment-verification')
@Injectable()
export class PaymentVerificationProcessor {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly monitorService: BlockchainMonitorService,
        private readonly cryptoPaymentService: CryptoPaymentService,
        private readonly walletService: WalletService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(PaymentVerificationProcessor.name);
    }

    /**
     * Handle verify-payment job
     * Checks if payment has been received on blockchain
     * @param job - Bull job with paymentId
     */
    @Process('verify-payment')
    async handleVerifyPayment(job: Job<VerifyPaymentJobData>): Promise<void> {
        const { paymentId, orderId } = job.data;
        const jobId = job.id?.toString() || 'unknown';

        this.logger.info(
            {
                jobId,
                paymentId,
                orderId,
                attempt: job.attemptsMade + 1,
                maxAttempts: job.opts.attempts,
            },
            'Processing verify-payment job'
        );

        try {
            // Verify payment exists and is in correct state
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                    select: {
                        id: true,
                        status: true,
                        expiresAt: true,
                        orderId: true,
                    },
                }
            );

            if (!payment) {
                this.logger.warn(
                    { jobId, paymentId },
                    'Payment not found, skipping verification'
                );
                return; // Don't retry if payment doesn't exist
            }

            // Skip if already processed
            if (
                payment.status !== PaymentStatus.PENDING &&
                payment.status !== PaymentStatus.PAID
            ) {
                this.logger.debug(
                    {
                        jobId,
                        paymentId,
                        status: payment.status,
                    },
                    'Payment already processed, skipping verification'
                );
                return;
            }

            // Check if expired
            if (new Date() > payment.expiresAt) {
                this.logger.info(
                    { jobId, paymentId, expiresAt: payment.expiresAt },
                    'Payment expired, expiring payment'
                );
                await this.cryptoPaymentService.expirePayment(paymentId);
                return;
            }

            // Check payment on blockchain
            await this.monitorService.checkPayment(paymentId);

            this.logger.info(
                { jobId, paymentId },
                'Payment verification completed successfully'
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(
                {
                    jobId,
                    paymentId,
                    error: errorMessage,
                    attempt: job.attemptsMade + 1,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to verify payment'
            );

            // Re-throw to trigger Bull retry mechanism
            throw error;
        }
    }

    /**
     * Handle check-confirmations job
     * Monitors transaction confirmations and re-queues if needed
     * @param job - Bull job with paymentId
     */
    @Process('check-confirmations')
    async handleCheckConfirmations(
        job: Job<CheckConfirmationsJobData>
    ): Promise<void> {
        const { paymentId } = job.data;
        const jobId = job.id?.toString() || 'unknown';

        this.logger.info(
            {
                jobId,
                paymentId,
                attempt: job.attemptsMade + 1,
                maxAttempts: job.opts.attempts,
            },
            'Processing check-confirmations job'
        );

        try {
            // Get payment details
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                    select: {
                        id: true,
                        status: true,
                        txHash: true,
                        confirmations: true,
                        requiredConfirmations: true,
                        cryptocurrency: true,
                    },
                }
            );

            if (!payment) {
                this.logger.warn(
                    { jobId, paymentId },
                    'Payment not found, skipping confirmation check'
                );
                return;
            }

            // Skip if already confirmed
            if (payment.status === PaymentStatus.CONFIRMED) {
                this.logger.debug(
                    { jobId, paymentId },
                    'Payment already confirmed, skipping'
                );
                return;
            }

            // Skip if no transaction hash
            if (!payment.txHash) {
                this.logger.warn(
                    { jobId, paymentId },
                    'No transaction hash found, skipping confirmation check'
                );
                return;
            }

            // Re-queue when needed is handled only in BlockchainMonitorService.checkConfirmations
            // to avoid duplicate delayed jobs (processor used to enqueue a second copy here).
            await this.monitorService.checkConfirmations(paymentId);

            this.logger.info(
                { jobId, paymentId },
                'Confirmation check completed successfully'
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(
                {
                    jobId,
                    paymentId,
                    error: errorMessage,
                    attempt: job.attemptsMade + 1,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to check confirmations'
            );

            // Re-throw to trigger Bull retry mechanism
            throw error;
        }
    }

    @Process('verify-topup')
    async handleVerifyTopUp(job: Job<VerifyTopUpJobData>): Promise<void> {
        const { topUpId } = job.data;
        await this.monitorService.checkTopUp(topUpId);
    }

    @Process('check-topup-confirmations')
    async handleCheckTopUpConfirmations(
        job: Job<CheckTopUpConfirmationsJobData>
    ): Promise<void> {
        const { topUpId } = job.data;
        await this.monitorService.checkTopUpConfirmations(topUpId);
    }

    /**
     * Handle expire-payment job
     * Expires payments that have passed their expiration time
     * @param job - Bull job with paymentId
     */
    @Process('expire-payment')
    async handleExpirePayment(job: Job<ExpirePaymentJobData>): Promise<void> {
        const { paymentId } = job.data;
        const jobId = job.id?.toString() || 'unknown';

        this.logger.info(
            {
                jobId,
                paymentId,
                attempt: job.attemptsMade + 1,
            },
            'Processing expire-payment job'
        );

        try {
            await this.cryptoPaymentService.expirePayment(paymentId);

            this.logger.info(
                { jobId, paymentId },
                'Payment expired successfully'
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(
                {
                    jobId,
                    paymentId,
                    error: errorMessage,
                    attempt: job.attemptsMade + 1,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to expire payment'
            );

            // Don't re-throw for expiration - it's not critical if it fails
            // The cron job will catch expired payments anyway
        }
    }

    /**
     * Scheduled task: Check all pending payments every minute.
     * @Cron decorator lives on PaymentScheduler (singleton) which delegates here.
     */
    async handlePendingPaymentsCron(): Promise<void> {
        this.logger.debug('Starting scheduled check of all pending payments');

        try {
            await this.monitorService.checkPendingPayments();
            await this.monitorService.checkPendingWalletTopUps();

            this.logger.debug('Completed scheduled check of pending payments');
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(
                {
                    error: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to check pending payments or wallet top-ups in scheduled task'
            );
            // Don't throw - allow next cron run to try again
        }
    }

    /**
     * Scheduled task: Expire old payments (runs every 5 minutes).
     * @Cron decorator lives on PaymentScheduler (singleton) which delegates here.
     */
    async handleExpiredPaymentsCron(): Promise<void> {
        this.logger.debug(
            'Starting scheduled expiration check for old payments'
        );

        try {
            const expiredPayments =
                await this.databaseService.cryptoPayment.findMany({
                    where: {
                        status: PaymentStatus.PENDING,
                        expiresAt: {
                            lt: new Date(), // Expired
                        },
                    },
                    select: {
                        id: true,
                        expiresAt: true,
                    },
                    take: 100, // Limit to 100 per batch
                });

            if (expiredPayments.length === 0) {
                this.logger.debug('No expired payments found');
                return;
            }

            this.logger.info(
                { count: expiredPayments.length },
                'Found expired payments to process'
            );

            // Expire payments in parallel (with concurrency limit)
            const concurrency = 10;
            for (let i = 0; i < expiredPayments.length; i += concurrency) {
                const batch = expiredPayments.slice(i, i + concurrency);
                await Promise.allSettled(
                    batch.map(payment =>
                        this.cryptoPaymentService.expirePayment(payment.id)
                    )
                );
            }

            this.logger.info(
                { count: expiredPayments.length },
                'Completed expiration check for old payments'
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(
                {
                    error: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to expire old payments in scheduled task'
            );
            // Don't throw - allow next cron run to try again
        }
    }

    /**
     * Safety net: expire wallet top-ups that stayed PENDING past expiresAt.
     * @Cron decorator lives on PaymentScheduler (singleton) which delegates here.
     */
    async handleExpiredWalletTopUpsCron(): Promise<void> {
        this.logger.debug(
            'Starting scheduled expiration check for wallet top-ups'
        );

        try {
            const expiredTopUps =
                await this.databaseService.walletTopUp.findMany({
                    where: {
                        status: PaymentStatus.PENDING,
                        expiresAt: {
                            lt: new Date(),
                        },
                    },
                    select: {
                        id: true,
                        expiresAt: true,
                    },
                    take: 100,
                });

            if (expiredTopUps.length === 0) {
                this.logger.debug('No expired wallet top-ups found');
                return;
            }

            this.logger.info(
                { count: expiredTopUps.length },
                'Found expired wallet top-ups to process'
            );

            const concurrency = 10;
            for (let i = 0; i < expiredTopUps.length; i += concurrency) {
                const batch = expiredTopUps.slice(i, i + concurrency);
                await Promise.allSettled(
                    batch.map(t => this.walletService.expireWalletTopUp(t.id))
                );
            }

            this.logger.info(
                { count: expiredTopUps.length },
                'Completed expiration check for wallet top-ups'
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(
                {
                    error: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to expire old wallet top-ups in scheduled task'
            );
        }
    }
}
