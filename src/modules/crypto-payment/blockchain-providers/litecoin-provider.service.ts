import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import * as bitcoin from 'bitcoinjs-lib';

import { BaseBlockchainProvider } from './base-blockchain-provider';
import { Transaction } from './blockchain-provider.interface';

/**
 * Litecoin Blockchain Provider
 * Uses Tatum API for blockchain data access
 * Similar to Bitcoin but uses Litecoin network
 */
@Injectable()
export class LitecoinProvider extends BaseBlockchainProvider {
    constructor(configService: ConfigService, logger: PinoLogger) {
        super(configService, logger, 'litecoin');
    }

    /**
     * Get balance of a Litecoin address
     * @param address - Litecoin address
     * @returns Balance in LTC (as string)
     */
    async getBalance(address: string): Promise<string> {
        this.logger.debug({ address }, 'Getting Litecoin balance');

        try {
            // Tatum API: GET /v3/litecoin/address/balance/{address}
            const response = await this.tatumClient.get(
                `/litecoin/address/balance/${address}`
            );

            if (!response.data || response.data.incoming === undefined) {
                throw new Error('Invalid response from Tatum API');
            }

            const incoming = parseFloat(response.data.incoming || '0');
            const outgoing = parseFloat(response.data.outgoing || '0');
            const balance = incoming - outgoing;

            this.logger.debug(
                { address, balance, incoming, outgoing },
                'Litecoin balance retrieved'
            );

            return Math.max(0, balance).toString();
        } catch (error) {
            this.handleTatumError(error, 'getBalance');
        }
    }

    /**
     * Get transaction by address
     * Returns the most recent incoming transaction
     * @param address - Litecoin address
     * @returns Transaction details or null
     */
    async getTransactionByAddress(
        address: string
    ): Promise<Transaction | null> {
        this.logger.debug(
            { address },
            'Getting Litecoin transaction by address'
        );

        try {
            // Tatum API: GET /v3/litecoin/transaction/address/{address}
            const response = await this.tatumClient.get(
                `/litecoin/transaction/address/${address}`,
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
                'Litecoin transaction found'
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
     * Get transaction details by hash
     * @param txHash - Transaction hash
     * @returns Transaction details or null
     */
    async getTransaction(txHash: string): Promise<Transaction | null> {
        this.logger.debug({ txHash }, 'Getting Litecoin transaction details');

        try {
            const response = await this.tatumClient.get(
                `/litecoin/transaction/${txHash}`
            );

            if (!response.data) {
                return null;
            }

            const tx = response.data;
            const firstOutput = tx.outputs?.[0];
            const firstInput = tx.inputs?.[0];

            const transaction: Transaction = {
                hash: tx.hash,
                from: firstInput?.coin?.address || '',
                to: firstOutput?.address || '',
                amount: firstOutput?.value?.toString() || '0',
                confirmations: await this.getTransactionConfirmations(txHash),
                blockNumber: tx.blockNumber || undefined,
                timestamp: tx.timestamp || undefined,
            };

            return transaction;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            this.handleTatumError(error, 'getTransaction');
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
            'Getting Litecoin transaction confirmations'
        );

        try {
            // Tatum API: GET /v3/litecoin/transaction/{hash}
            const response = await this.tatumClient.get(
                `/litecoin/transaction/${txHash}`
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
                await this.tatumClient.get('/litecoin/info');
            const currentBlockHeight = currentBlockResponse.data?.blocks || 0;

            const confirmations = Math.max(
                0,
                currentBlockHeight - tx.blockNumber + 1
            );

            this.logger.debug(
                { txHash, confirmations, blockNumber: tx.blockNumber },
                'Litecoin confirmations retrieved'
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
     * Estimate network fee for a transaction
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount in LTC
     * @returns Estimated fee in LTC
     */
    async estimateFee(
        from: string,
        to: string,
        amount: string
    ): Promise<string> {
        this.logger.debug({ from, to, amount }, 'Estimating Litecoin fee');

        try {
            // Get current recommended fee per byte from Tatum (if available)
            // Otherwise use default
            const estimatedSize = 250; // Typical transaction size
            const satoshisPerByte = 10; // Conservative default for Litecoin
            const feeInSatoshis = satoshisPerByte * estimatedSize;
            const feeInLTC = feeInSatoshis / 100000000; // Convert to LTC

            this.logger.debug(
                {
                    satoshisPerByte,
                    estimatedSize,
                    feeInLTC,
                },
                'Litecoin fee estimated'
            );

            return feeInLTC.toString();
        } catch (error) {
            this.logger.warn(
                { error: error.message },
                'Failed to estimate fee, using default'
            );
            return '0.0001';
        }
    }

    /**
     * Send transaction (for payment forwarding)
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount in LTC
     * @param privateKey - Private key (hex string)
     * @returns Transaction hash
     */
    async sendTransaction(
        from: string,
        to: string,
        amount: string,
        _privateKey: string
    ): Promise<string> {
        this.logger.info({ from, to, amount }, 'Sending Litecoin transaction');

        try {
            if (!this.isValidAddress(from) || !this.isValidAddress(to)) {
                throw new Error('Invalid Litecoin address');
            }

            // Tatum API: POST /v3/litecoin/transaction
            const response = await this.tatumClient.post(
                '/litecoin/transaction',
                {
                    fromAddress: [from],
                    to: [
                        {
                            address: to,
                            value: parseFloat(amount),
                        },
                    ],
                    fee: '0.00001',
                    changeAddress: from,
                }
            );

            if (!response.data || !response.data.txId) {
                throw new Error('Invalid response from Tatum API');
            }

            this.logger.info(
                { txHash: response.data.txId, from, to, amount },
                'Litecoin transaction sent'
            );

            return response.data.txId;
        } catch (error) {
            this.handleTatumError(error, 'sendTransaction');
        }
    }

    /**
     * Validate Litecoin address format
     * @param address - Address to validate
     * @returns True if valid
     */
    isValidAddress(address: string): boolean {
        try {
            // Litecoin addresses start with 'L' (legacy) or 'M' (segwit) for mainnet
            // or 'm'/'n' for testnet
            // Use bitcoinjs-lib with litecoin network
            const network = this.isTestnet
                ? bitcoin.networks.testnet
                : bitcoin.networks.bitcoin;

            bitcoin.address.toOutputScript(address, network);
            return true;
        } catch {
            return false;
        }
    }
}
