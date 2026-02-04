import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { PaymentStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { BlockchainMonitorService } from '../services/blockchain-monitor.service';
import { CryptoPaymentService } from '../services/crypto-payment.service';

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
 * - Every minute: Check all pending payments
 */
@Processor('crypto-payment-verification')
@Injectable()
export class PaymentVerificationProcessor {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly monitorService: BlockchainMonitorService,
        private readonly cryptoPaymentService: CryptoPaymentService,
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

            // Check confirmations
            await this.monitorService.checkConfirmations(paymentId);

            // Refresh payment to check if it was confirmed
            const updatedPayment =
                await this.databaseService.cryptoPayment.findUnique({
                    where: { id: paymentId },
                    select: {
                        status: true,
                        confirmations: true,
                        requiredConfirmations: true,
                    },
                });

            if (!updatedPayment) {
                return;
            }

            // Re-queue if not confirmed yet and hasn't exceeded max attempts
            if (
                updatedPayment.status !== PaymentStatus.CONFIRMED &&
                updatedPayment.confirmations <
                    updatedPayment.requiredConfirmations &&
                job.attemptsMade + 1 < (job.opts.attempts || 10)
            ) {
                const remainingConfirmations =
                    updatedPayment.requiredConfirmations -
                    updatedPayment.confirmations;
                const delay = Math.min(300000, remainingConfirmations * 60000); // Max 5 minutes, or 1 min per confirmation needed

                this.logger.debug(
                    {
                        jobId,
                        paymentId,
                        confirmations: updatedPayment.confirmations,
                        required: updatedPayment.requiredConfirmations,
                        delay,
                    },
                    'Re-queuing confirmation check'
                );

                // Note: The monitor service already handles re-queuing,
                // but we can also do it here for redundancy
                await job.queue.add(
                    'check-confirmations',
                    { paymentId },
                    {
                        delay,
                        attempts: 10,
                        backoff: {
                            type: 'exponential',
                            delay: 60000,
                        },
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );
            } else if (updatedPayment.status === PaymentStatus.CONFIRMED) {
                this.logger.info(
                    {
                        jobId,
                        paymentId,
                        confirmations: updatedPayment.confirmations,
                    },
                    'Payment confirmed, no need to re-queue'
                );
            }

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
     * Scheduled task: Check all pending payments every minute
     * This ensures no payments are missed even if jobs fail
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async handlePendingPaymentsCron(): Promise<void> {
        this.logger.debug('Starting scheduled check of all pending payments');

        try {
            await this.monitorService.checkPendingPayments();

            this.logger.debug('Completed scheduled check of pending payments');
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(
                {
                    error: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to check pending payments in scheduled task'
            );
            // Don't throw - allow next cron run to try again
        }
    }

    /**
     * Scheduled task: Expire old payments (runs every 5 minutes)
     * This is a safety net to catch any payments that weren't expired properly
     */
    @Cron('*/5 * * * *') // Every 5 minutes
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
}
