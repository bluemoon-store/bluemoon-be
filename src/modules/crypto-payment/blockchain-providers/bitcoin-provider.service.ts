import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import * as bitcoin from 'bitcoinjs-lib';

import { BaseBlockchainProvider } from './base-blockchain-provider';
import { Transaction } from './blockchain-provider.interface';

/**
 * Bitcoin Blockchain Provider
 * Uses Tatum API for blockchain data access
 */
@Injectable()
export class BitcoinProvider extends BaseBlockchainProvider {
    constructor(configService: ConfigService, logger: PinoLogger) {
        super(configService, logger, 'bitcoin');
    }

    /**
     * Get balance of a Bitcoin address
     * @param address - Bitcoin address
     * @returns Balance in BTC (as string)
     */
    async getBalance(address: string): Promise<string> {
        this.logger.debug({ address }, 'Getting Bitcoin balance');

        try {
            // Tatum API: GET /v3/bitcoin/address/balance/{address}
            const response = await this.tatumClient.get(
                `/bitcoin/address/balance/${address}`
            );

            if (!response.data || response.data.incoming === undefined) {
                throw new Error('Invalid response from Tatum API');
            }

            // Tatum returns balance in BTC (already in decimal format)
            const incoming = parseFloat(response.data.incoming || '0');
            const outgoing = parseFloat(response.data.outgoing || '0');
            const balance = incoming - outgoing;

            this.logger.debug(
                { address, balance, incoming, outgoing },
                'Bitcoin balance retrieved'
            );

            return Math.max(0, balance).toString();
        } catch (error) {
            this.handleTatumError(error, 'getBalance');
        }
    }

    /**
     * Get transaction by address
     * Returns the most recent incoming transaction
     * @param address - Bitcoin address
     * @returns Transaction details or null
     */
    async getTransactionByAddress(
        address: string
    ): Promise<Transaction | null> {
        this.logger.debug(
            { address },
            'Getting Bitcoin transaction by address'
        );

        try {
            // Tatum API: GET /v3/bitcoin/transaction/address/{address}
            const response = await this.tatumClient.get(
                `/bitcoin/transaction/address/${address}`,
                {
                    params: {
                        pageSize: 10, // Get recent transactions
                    },
                }
            );

            if (!response.data || !Array.isArray(response.data)) {
                return null;
            }

            // Find the most recent incoming transaction
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

            // Calculate total amount received in this transaction
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
                'Bitcoin transaction found'
            );

            return transaction;
        } catch (error) {
            // If no transactions found, return null instead of throwing
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
            'Getting Bitcoin transaction confirmations'
        );

        try {
            // Tatum API: GET /v3/bitcoin/transaction/{hash}
            const response = await this.tatumClient.get(
                `/bitcoin/transaction/${txHash}`
            );

            if (!response.data) {
                return 0;
            }

            const tx = response.data;

            // If transaction is not in a block yet, return 0 confirmations
            if (!tx.blockNumber) {
                return 0;
            }

            // Get current block height
            const currentBlockResponse =
                await this.tatumClient.get('/bitcoin/info');
            const currentBlockHeight = currentBlockResponse.data?.blocks || 0;

            // Calculate confirmations
            const confirmations = Math.max(
                0,
                currentBlockHeight - tx.blockNumber + 1
            );

            this.logger.debug(
                { txHash, confirmations, blockNumber: tx.blockNumber },
                'Bitcoin confirmations retrieved'
            );

            return confirmations;
        } catch (error) {
            // If transaction not found, return 0
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
     * @param amount - Amount in BTC
     * @param privateKey - Private key (hex string)
     * @returns Transaction hash
     */
    async sendTransaction(
        from: string,
        to: string,
        amount: string,
        _privateKey: string
    ): Promise<string> {
        this.logger.info({ from, to, amount }, 'Sending Bitcoin transaction');

        try {
            // Validate addresses
            if (!this.isValidAddress(from) || !this.isValidAddress(to)) {
                throw new Error('Invalid Bitcoin address');
            }

            // Tatum API: POST /v3/bitcoin/transaction
            // Note: This is a simplified implementation
            // In production, you'd need to handle UTXO selection, fee calculation, etc.
            const response = await this.tatumClient.post(
                '/bitcoin/transaction',
                {
                    fromAddress: [from],
                    to: [
                        {
                            address: to,
                            value: parseFloat(amount),
                        },
                    ],
                    fee: '0.00001', // Default fee (should be calculated dynamically)
                    changeAddress: from,
                }
            );

            if (!response.data || !response.data.txId) {
                throw new Error('Invalid response from Tatum API');
            }

            this.logger.info(
                { txHash: response.data.txId, from, to, amount },
                'Bitcoin transaction sent'
            );

            return response.data.txId;
        } catch (error) {
            this.handleTatumError(error, 'sendTransaction');
        }
    }

    /**
     * Validate Bitcoin address format
     * @param address - Address to validate
     * @returns True if valid
     */
    isValidAddress(address: string): boolean {
        try {
            // Use bitcoinjs-lib to validate address
            const network = this.isTestnet
                ? bitcoin.networks.testnet
                : bitcoin.networks.bitcoin;

            // Try to decode the address
            bitcoin.address.toOutputScript(address, network);
            return true;
        } catch {
            return false;
        }
    }
}
