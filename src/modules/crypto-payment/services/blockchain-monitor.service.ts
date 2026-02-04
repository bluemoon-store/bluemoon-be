import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { CryptoCurrency, PaymentStatus, OrderStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { CryptoPaymentService } from './crypto-payment.service';
import { BlockchainProviderFactory } from '../blockchain-providers/blockchain-provider.factory';
// import { EthereumProvider } from '../blockchain-providers/ethereum-provider.service';
import { IBlockchainMonitorService } from '../interfaces/blockchain-monitor.service.interface';

/**
 * Blockchain Monitor Service
 * Monitors blockchain for incoming payments and tracks confirmations
 */
@Injectable()
export class BlockchainMonitorService implements IBlockchainMonitorService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly cryptoPaymentService: CryptoPaymentService,
        private readonly providerFactory: BlockchainProviderFactory,
        @InjectQueue('crypto-payment-verification')
        private readonly paymentVerificationQueue: Queue,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(BlockchainMonitorService.name);
    }

    /**
     * Check a single payment for incoming transaction
     * @param paymentId - Payment ID
     */
    async checkPayment(paymentId: string): Promise<void> {
        this.logger.debug({ paymentId }, 'Checking payment');

        try {
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                    include: {
                        order: true,
                    },
                }
            );

            if (!payment) {
                this.logger.warn({ paymentId }, 'Payment not found');
                return;
            }

            // Skip if payment is not pending
            if (payment.status !== PaymentStatus.PENDING) {
                this.logger.debug(
                    { paymentId, status: payment.status },
                    'Payment not pending, skipping check'
                );
                return;
            }

            // Check if payment has expired
            const now = new Date();
            if (now > payment.expiresAt) {
                this.logger.info(
                    { paymentId, expiresAt: payment.expiresAt },
                    'Payment expired, expiring payment'
                );
                await this.cryptoPaymentService.expirePayment(paymentId);
                return;
            }

            // Get blockchain provider
            const provider = this.providerFactory.getProvider(
                payment.cryptocurrency
            );

            // Check balance
            let balance: string;
            let transaction = null;

            if (
                payment.cryptocurrency === CryptoCurrency.USDT_ERC20 ||
                payment.cryptocurrency === CryptoCurrency.USDC_ERC20
            ) {
                // ERC-20 token - use Ethereum provider with token contract
                const ethereumProvider =
                    this.providerFactory.getEthereumProvider();
                const tokenContract = this.getTokenContractAddress(
                    payment.cryptocurrency
                );

                if (!tokenContract) {
                    this.logger.error(
                        { paymentId, cryptocurrency: payment.cryptocurrency },
                        'Token contract address not found'
                    );
                    return;
                }

                balance = await ethereumProvider.getERC20BalancePublic(
                    payment.paymentAddress,
                    tokenContract
                );
                transaction =
                    await ethereumProvider.getERC20TransactionByAddressPublic(
                        payment.paymentAddress,
                        tokenContract
                    );
            } else {
                // Native cryptocurrency
                balance = await provider.getBalance(payment.paymentAddress);
                transaction = await provider.getTransactionByAddress(
                    payment.paymentAddress
                );
            }

            const balanceNumber = parseFloat(balance);
            const expectedAmount = parseFloat(payment.amount.toString());

            this.logger.debug(
                {
                    paymentId,
                    address: payment.paymentAddress,
                    balance: balanceNumber,
                    expectedAmount,
                    cryptocurrency: payment.cryptocurrency,
                },
                'Balance checked'
            );

            // Check if payment amount is met or exceeded
            if (balanceNumber >= expectedAmount) {
                // Payment detected!
                this.logger.info(
                    {
                        paymentId,
                        orderId: payment.orderId,
                        address: payment.paymentAddress,
                        amount: balanceNumber,
                        expectedAmount,
                        txHash: transaction?.hash,
                    },
                    'Payment detected on blockchain'
                );

                // Update payment status to PAID
                await this.databaseService.cryptoPayment.update({
                    where: { id: paymentId },
                    data: {
                        status: PaymentStatus.PAID,
                        paidAt: new Date(),
                        txHash: transaction?.hash || null,
                        confirmations: transaction?.confirmations || 0,
                    },
                });

                // Queue confirmation checking job
                await this.paymentVerificationQueue.add(
                    'check-confirmations',
                    { paymentId },
                    {
                        attempts: 10, // Check up to 10 times
                        backoff: {
                            type: 'exponential',
                            delay: 60000, // Start with 1 minute delay
                        },
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                this.logger.info(
                    { paymentId },
                    'Payment marked as PAID, confirmation check queued'
                );
            } else if (balanceNumber > 0) {
                // Partial payment detected
                this.logger.warn(
                    {
                        paymentId,
                        balance: balanceNumber,
                        expectedAmount,
                        percentage: (balanceNumber / expectedAmount) * 100,
                    },
                    'Partial payment detected (insufficient amount)'
                );
            }
        } catch (error) {
            this.logger.error({ error, paymentId }, 'Failed to check payment');
            // Don't throw - allow retry
        }
    }

    /**
     * Check all pending payments
     */
    async checkPendingPayments(): Promise<void> {
        this.logger.debug('Checking all pending payments');

        try {
            const pendingPayments =
                await this.databaseService.cryptoPayment.findMany({
                    where: {
                        status: PaymentStatus.PENDING,
                        expiresAt: {
                            gt: new Date(), // Not expired yet
                        },
                    },
                    select: {
                        id: true,
                    },
                    take: 100, // Limit to 100 payments per batch
                });

            this.logger.info(
                { count: pendingPayments.length },
                'Found pending payments to check'
            );

            // Check payments in parallel (with concurrency limit)
            const concurrency = 5; // Check 5 payments at a time
            for (let i = 0; i < pendingPayments.length; i += concurrency) {
                const batch = pendingPayments.slice(i, i + concurrency);
                await Promise.allSettled(
                    batch.map(payment => this.checkPayment(payment.id))
                );
            }

            this.logger.info(
                { count: pendingPayments.length },
                'Finished checking pending payments'
            );
        } catch (error) {
            this.logger.error({ error }, 'Failed to check pending payments');
            // Don't throw - allow retry
        }
    }

    /**
     * Check transaction confirmations
     * @param paymentId - Payment ID
     */
    async checkConfirmations(paymentId: string): Promise<void> {
        this.logger.debug({ paymentId }, 'Checking transaction confirmations');

        try {
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                }
            );

            if (!payment || !payment.txHash) {
                this.logger.warn(
                    { paymentId },
                    'Payment or transaction hash not found'
                );
                return;
            }

            // Skip if already confirmed
            if (payment.status === PaymentStatus.CONFIRMED) {
                this.logger.debug({ paymentId }, 'Payment already confirmed');
                return;
            }

            // Get blockchain provider
            const provider = this.providerFactory.getProvider(
                payment.cryptocurrency
            );

            // Get current confirmations
            const confirmations = await provider.getTransactionConfirmations(
                payment.txHash
            );

            this.logger.debug(
                {
                    paymentId,
                    txHash: payment.txHash,
                    confirmations,
                    required: payment.requiredConfirmations,
                },
                'Confirmations checked'
            );

            // Update confirmation count
            await this.databaseService.cryptoPayment.update({
                where: { id: paymentId },
                data: {
                    confirmations,
                    status:
                        confirmations > 0
                            ? PaymentStatus.CONFIRMING
                            : PaymentStatus.PAID,
                },
            });

            // Check if required confirmations met
            if (confirmations >= payment.requiredConfirmations) {
                this.logger.info(
                    {
                        paymentId,
                        confirmations,
                        required: payment.requiredConfirmations,
                    },
                    'Required confirmations met, confirming payment'
                );
                await this.confirmPayment(paymentId);
            } else {
                // Re-queue for another check if not confirmed yet
                const remainingConfirmations =
                    payment.requiredConfirmations - confirmations;
                const delay = Math.min(300000, remainingConfirmations * 60000); // Max 5 minutes, or 1 min per confirmation needed

                await this.paymentVerificationQueue.add(
                    'check-confirmations',
                    { paymentId },
                    {
                        delay,
                        attempts: 10,
                        removeOnComplete: true,
                        removeOnFail: false,
                    }
                );

                this.logger.debug(
                    {
                        paymentId,
                        confirmations,
                        required: payment.requiredConfirmations,
                        delay,
                    },
                    'Re-queued confirmation check'
                );
            }
        } catch (error) {
            this.logger.error(
                { error, paymentId },
                'Failed to check confirmations'
            );
            // Don't throw - allow retry
        }
    }

    /**
     * Confirm payment after required confirmations
     * @param paymentId - Payment ID
     */
    async confirmPayment(paymentId: string): Promise<void> {
        this.logger.info({ paymentId }, 'Confirming payment');

        try {
            const payment = await this.databaseService.cryptoPayment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentStatus.CONFIRMED,
                    confirmedAt: new Date(),
                },
                include: {
                    order: true,
                },
            });

            this.logger.info(
                {
                    paymentId,
                    orderId: payment.orderId,
                    cryptocurrency: payment.cryptocurrency,
                    amount: payment.amount.toString(),
                },
                'Payment confirmed'
            );

            // Update order status to PAYMENT_RECEIVED
            await this.databaseService.order.update({
                where: { id: payment.orderId },
                data: {
                    status: OrderStatus.PAYMENT_RECEIVED,
                },
            });

            this.logger.info(
                { paymentId, orderId: payment.orderId },
                'Order status updated to PAYMENT_RECEIVED'
            );

            // TODO: Queue order processing job
            // await this.orderQueue.add('process-order', { orderId: payment.orderId });

            // TODO: Send notification
            // await this.notificationService.sendPaymentConfirmed(payment.orderId);

            // Note: Payment forwarding logic will be implemented in Phase 6.7
            // Forwarding can be queued here if needed:
            // const enableForwarding = this.configService.get<boolean>('crypto.payment.enableForwarding', false);
            // if (enableForwarding && this.shouldForwardPayment(payment)) {
            //   await this.paymentVerificationQueue.add('forward-payment', { paymentId });
            // }
        } catch (error) {
            this.logger.error(
                { error, paymentId },
                'Failed to confirm payment'
            );
            throw error; // Re-throw for retry
        }
    }

    /**
     * Get ERC-20 token contract address
     * @param cryptocurrency - Cryptocurrency type
     * @returns Contract address
     */
    private getTokenContractAddress(cryptocurrency: CryptoCurrency): string {
        const ethereumProvider = this.providerFactory.getEthereumProvider();

        if (cryptocurrency === CryptoCurrency.USDT_ERC20) {
            return ethereumProvider.getTokenContractAddress('USDT') || '';
        }

        if (cryptocurrency === CryptoCurrency.USDC_ERC20) {
            return ethereumProvider.getTokenContractAddress('USDC') || '';
        }

        return '';
    }
}
