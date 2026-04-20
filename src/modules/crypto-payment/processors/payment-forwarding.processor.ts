import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PaymentStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { PaymentForwardingService } from '../services/payment-forwarding.service';

/**
 * Payment Forwarding Job Data Types
 */
interface ForwardPaymentJobData {
    paymentId: string;
}

/**
 * Payment Forwarding Processor
 * Handles background jobs for forwarding confirmed payments to platform wallets
 *
 * Job Types:
 * - forward-payment: Forward a confirmed payment to platform wallet
 */
@Processor('crypto-payment-forwarding')
@Injectable()
export class PaymentForwardingProcessor {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly forwardingService: PaymentForwardingService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(PaymentForwardingProcessor.name);
    }

    /**
     * Handle forward-payment job
     * Forwards a confirmed payment to the platform wallet
     * @param job - Bull job with paymentId
     */
    @Process('forward-payment')
    async handleForwardPayment(job: Job<ForwardPaymentJobData>): Promise<void> {
        const { paymentId } = job.data;
        const jobId = job.id?.toString() || 'unknown';

        this.logger.info(
            {
                jobId,
                paymentId,
                attempt: job.attemptsMade + 1,
                maxAttempts: job.opts.attempts,
            },
            'Processing forward-payment job'
        );

        try {
            // Verify payment exists and is in correct state
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                    select: {
                        id: true,
                        status: true,
                        forwardTxHash: true,
                        orderId: true,
                        cryptocurrency: true,
                    },
                }
            );

            if (!payment) {
                this.logger.warn(
                    { jobId, paymentId },
                    'Payment not found, skipping forwarding'
                );
                return; // Don't retry if payment doesn't exist
            }

            // Skip if already forwarded
            if (
                payment.status === PaymentStatus.FORWARDED &&
                payment.forwardTxHash
            ) {
                this.logger.debug(
                    {
                        jobId,
                        paymentId,
                        forwardTxHash: payment.forwardTxHash,
                    },
                    'Payment already forwarded, skipping'
                );
                return;
            }

            const canForward =
                (payment.status === PaymentStatus.CONFIRMED ||
                    payment.status === PaymentStatus.FORWARDING) &&
                !payment.forwardTxHash;

            if (!canForward) {
                this.logger.debug(
                    {
                        jobId,
                        paymentId,
                        status: payment.status,
                    },
                    'Payment not forwardable, skipping'
                );
                return;
            }

            // Forward payment
            const forwardTxHash =
                await this.forwardingService.forwardPayment(paymentId);

            this.logger.info(
                {
                    jobId,
                    paymentId,
                    orderId: payment.orderId,
                    forwardTxHash,
                    cryptocurrency: payment.cryptocurrency,
                },
                'Payment forwarded successfully'
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
                'Failed to forward payment'
            );

            // Re-throw to trigger Bull retry mechanism
            // But only if it's not a validation error (those shouldn't retry)
            if (
                errorMessage.includes('not found') ||
                errorMessage.includes('must be CONFIRMED or FORWARDING') ||
                errorMessage.includes('already forwarded')
            ) {
                this.logger.warn(
                    { jobId, paymentId, error: errorMessage },
                    'Validation error, not retrying'
                );
                return; // Don't retry validation errors
            }

            throw error; // Re-throw for retry
        }
    }
}
