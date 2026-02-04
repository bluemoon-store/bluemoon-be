import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import axios, { AxiosInstance } from 'axios';

import {
    IBlockchainProvider,
    Transaction,
} from './blockchain-provider.interface';

/**
 * Base class for blockchain providers
 * Provides common functionality for Tatum API integration
 */
export abstract class BaseBlockchainProvider implements IBlockchainProvider {
    protected readonly tatumClient: AxiosInstance;
    protected readonly logger: PinoLogger;
    protected readonly network: string;
    protected readonly isTestnet: boolean;

    constructor(
        protected readonly configService: ConfigService,
        logger: PinoLogger,
        protected readonly chain: string // e.g., 'bitcoin', 'ethereum', 'litecoin'
    ) {
        this.logger = logger;
        this.logger.setContext(`${this.constructor.name}`);

        // Get Tatum configuration
        const tatumApiKey = this.configService.get<string>(
            'crypto.tatum.apiKey'
        );
        const tatumBaseUrl =
            this.configService.get<string>('crypto.tatum.baseUrl') ||
            'https://api.tatum.io/v3';
        this.isTestnet =
            this.configService.get<boolean>('crypto.tatum.testnet', false) ||
            false;

        // Initialize Tatum HTTP client
        this.tatumClient = axios.create({
            baseURL: tatumBaseUrl,
            headers: {
                'x-api-key': tatumApiKey || '',
            },
            timeout: 30000, // 30 seconds timeout for blockchain operations
        });

        // Determine network name
        this.network = this.isTestnet ? 'testnet' : 'mainnet';
    }

    /**
     * Get balance of an address
     * Must be implemented by subclasses
     */
    abstract getBalance(address: string): Promise<string>;

    /**
     * Get transaction by address
     * Must be implemented by subclasses
     */
    abstract getTransactionByAddress(
        address: string
    ): Promise<Transaction | null>;

    /**
     * Get transaction confirmations
     * Must be implemented by subclasses
     */
    abstract getTransactionConfirmations(txHash: string): Promise<number>;

    /**
     * Send transaction
     * Must be implemented by subclasses
     */
    abstract sendTransaction(
        from: string,
        to: string,
        amount: string,
        privateKey: string
    ): Promise<string>;

    /**
     * Validate address format
     * Must be implemented by subclasses
     */
    abstract isValidAddress(address: string): boolean;

    /**
     * Get network name
     */
    getNetworkName(): string {
        return this.network;
    }

    /**
     * Helper method to handle Tatum API errors
     */
    protected handleTatumError(error: any, operation: string): never {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            this.logger.error(
                {
                    status,
                    data,
                    operation,
                    chain: this.chain,
                },
                `Tatum API error during ${operation}`
            );

            throw new Error(
                `Tatum API error (${status}): ${data?.message || data?.error || 'Unknown error'}`
            );
        }

        if (error.request) {
            this.logger.error(
                {
                    operation,
                    chain: this.chain,
                },
                `No response from Tatum API during ${operation}`
            );
            throw new Error(`No response from Tatum API: ${operation}`);
        }

        this.logger.error(
            {
                error: error.message,
                operation,
                chain: this.chain,
            },
            `Error during ${operation}`
        );
        throw new Error(`${operation} failed: ${error.message}`);
    }
}
