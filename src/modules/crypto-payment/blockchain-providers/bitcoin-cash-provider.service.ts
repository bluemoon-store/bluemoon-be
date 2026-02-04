import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import { BaseBlockchainProvider } from './base-blockchain-provider';
import { Transaction } from './blockchain-provider.interface';

/**
 * Bitcoin Cash Blockchain Provider
 * Uses Tatum API for blockchain data access
 */
@Injectable()
export class BitcoinCashProvider extends BaseBlockchainProvider {
    constructor(configService: ConfigService, logger: PinoLogger) {
        super(configService, logger, 'bch');
    }

    /**
     * Get balance of a Bitcoin Cash address
     * @param address - Bitcoin Cash address
     * @returns Balance in BCH (as string)
     */
    async getBalance(address: string): Promise<string> {
        this.logger.debug({ address }, 'Getting Bitcoin Cash balance');

        try {
            // Tatum API: GET /v3/bcash/address/balance/{address}
            const response = await this.tatumClient.get(
                `/bcash/address/balance/${address}`
            );

            if (!response.data || response.data.incoming === undefined) {
                throw new Error('Invalid response from Tatum API');
            }

            const incoming = parseFloat(response.data.incoming || '0');
            const outgoing = parseFloat(response.data.outgoing || '0');
            const balance = incoming - outgoing;

            this.logger.debug(
                { address, balance, incoming, outgoing },
                'Bitcoin Cash balance retrieved'
            );

            return Math.max(0, balance).toString();
        } catch (error) {
            this.handleTatumError(error, 'getBalance');
        }
    }

    /**
     * Get transaction by address
     * Returns the most recent incoming transaction
     * @param address - Bitcoin Cash address
     * @returns Transaction details or null
     */
    async getTransactionByAddress(
        address: string
    ): Promise<Transaction | null> {
        this.logger.debug(
            { address },
            'Getting Bitcoin Cash transaction by address'
        );

        try {
            // Tatum API: GET /v3/bcash/transaction/address/{address}
            const response = await this.tatumClient.get(
                `/bcash/transaction/address/${address}`,
                {
                    params: {
                        pageSize: 10,
                    },
                }
            );

            if (!response.data || !Array.isArray(response.data)) {
                return null;
            }

            const transactions = response.data as any[];
            const incomingTx = transactions.find(
                (tx: any) =>
                    tx.outputs?.some(
                        (output: any) =>
                            output.address?.toLowerCase() ===
                            address.toLowerCase()
                    ) &&
                    tx.inputs?.some(
                        (input: any) =>
                            input.address?.toLowerCase() !==
                            address.toLowerCase()
                    )
            );

            if (!incomingTx) {
                this.logger.debug({ address }, 'No incoming transaction found');
                return null;
            }

            const receivedAmount = incomingTx.outputs
                .filter(
                    (output: any) =>
                        output.address?.toLowerCase() === address.toLowerCase()
                )
                .reduce((sum: number, output: any) => {
                    return sum + parseFloat(output.value || '0');
                }, 0);

            const transaction: Transaction = {
                hash: incomingTx.hash,
                from: incomingTx.inputs?.[0]?.address || '',
                to: address,
                amount: receivedAmount.toString(),
                confirmations: incomingTx.blockNumber
                    ? await this.getTransactionConfirmations(incomingTx.hash)
                    : 0,
                blockNumber: incomingTx.blockNumber || undefined,
                timestamp: incomingTx.timestamp || undefined,
            };

            this.logger.debug(
                {
                    address,
                    txHash: transaction.hash,
                    amount: transaction.amount,
                },
                'Bitcoin Cash transaction found'
            );

            return transaction;
        } catch (error) {
            if (error.response?.status === 404) {
                this.logger.debug(
                    { address },
                    'No transactions found for address'
                );
                return null;
            }
            this.handleTatumError(error, 'getTransactionByAddress');
        }
    }

    /**
     * Get transaction confirmations
     * @param txHash - Transaction hash
     * @returns Number of confirmations
     */
    async getTransactionConfirmations(txHash: string): Promise<number> {
        this.logger.debug(
            { txHash },
            'Getting Bitcoin Cash transaction confirmations'
        );

        try {
            // Tatum API: GET /v3/bcash/transaction/{hash}
            const response = await this.tatumClient.get(
                `/bcash/transaction/${txHash}`
            );

            if (!response.data) {
                return 0;
            }

            const tx = response.data;

            if (!tx.blockNumber) {
                return 0;
            }

            // Get current block height
            const currentBlockResponse =
                await this.tatumClient.get('/bcash/info');
            const currentBlockHeight = currentBlockResponse.data?.blocks || 0;

            const confirmations = Math.max(
                0,
                currentBlockHeight - tx.blockNumber + 1
            );

            this.logger.debug(
                { txHash, confirmations, blockNumber: tx.blockNumber },
                'Bitcoin Cash confirmations retrieved'
            );

            return confirmations;
        } catch (error) {
            if (error.response?.status === 404) {
                this.logger.debug({ txHash }, 'Transaction not found');
                return 0;
            }
            this.handleTatumError(error, 'getTransactionConfirmations');
        }
    }

    /**
     * Send transaction (for payment forwarding)
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount in BCH
     * @param privateKey - Private key (hex string)
     * @returns Transaction hash
     */
    async sendTransaction(
        from: string,
        to: string,
        amount: string,
        _privateKey: string
    ): Promise<string> {
        this.logger.info(
            { from, to, amount },
            'Sending Bitcoin Cash transaction'
        );

        try {
            if (!this.isValidAddress(from) || !this.isValidAddress(to)) {
                throw new Error('Invalid Bitcoin Cash address');
            }

            // Tatum API: POST /v3/bcash/transaction
            const response = await this.tatumClient.post('/bcash/transaction', {
                fromAddress: [from],
                to: [
                    {
                        address: to,
                        value: parseFloat(amount),
                    },
                ],
                fee: '0.00001',
                changeAddress: from,
            });

            if (!response.data || !response.data.txId) {
                throw new Error('Invalid response from Tatum API');
            }

            this.logger.info(
                { txHash: response.data.txId, from, to, amount },
                'Bitcoin Cash transaction sent'
            );

            return response.data.txId;
        } catch (error) {
            this.handleTatumError(error, 'sendTransaction');
        }
    }

    /**
     * Validate Bitcoin Cash address format
     * @param address - Address to validate
     * @returns True if valid
     */
    isValidAddress(address: string): boolean {
        try {
            // Bitcoin Cash addresses typically start with 'bitcoincash:' prefix
            // or 'q'/'p' for legacy format
            // Simple validation - check format
            const bchAddressRegex =
                /^(bitcoincash:)?([qpz][a-z0-9]{41}|[QPZ][A-Z0-9]{41})$/;
            return bchAddressRegex.test(address);
        } catch {
            return false;
        }
    }
}
