import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ethers } from 'ethers';

import { BaseBlockchainProvider } from './base-blockchain-provider';
import { Transaction } from './blockchain-provider.interface';

/**
 * ERC-20 Token Contract Addresses (Mainnet)
 */
const ERC20_CONTRACTS: Record<string, string> = {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
};

/**
 * Ethereum Blockchain Provider
 * Uses Tatum API for blockchain data access and ethers.js for transaction handling
 * Supports native ETH and ERC-20 tokens (USDT, USDC)
 */
@Injectable()
export class EthereumProvider extends BaseBlockchainProvider {
    private readonly rpcUrl: string;
    private readonly provider: ethers.JsonRpcProvider;

    constructor(configService: ConfigService, logger: PinoLogger) {
        super(configService, logger, 'ethereum');

        // Get RPC URL from config (fallback to Tatum if not provided)
        this.rpcUrl =
            configService.get<string>('crypto.rpc.ethereum') ||
            (this.isTestnet
                ? 'https://sepolia.infura.io/v3/YOUR_KEY'
                : 'https://mainnet.infura.io/v3/YOUR_KEY');

        // Initialize ethers provider
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    }

    /**
     * Get balance of an Ethereum address
     * Note: For ERC-20 tokens, use getERC20Balance directly
     * @param address - Ethereum address
     * @returns Balance in ETH (as string)
     */
    async getBalance(address: string): Promise<string> {
        this.logger.debug({ address }, 'Getting Ethereum balance');

        try {
            // Native ETH balance using Tatum API
            // Tatum API: GET /v3/ethereum/account/balance/{address}
            const response = await this.tatumClient.get(
                `/ethereum/account/balance/${address}`
            );

            if (!response.data || response.data.balance === undefined) {
                throw new Error('Invalid response from Tatum API');
            }

            // Tatum returns balance in Wei, convert to ETH
            const balanceWei = response.data.balance;
            const balanceEth = ethers.formatEther(balanceWei);

            this.logger.debug(
                { address, balance: balanceEth },
                'Ethereum balance retrieved'
            );

            return balanceEth;
        } catch (error) {
            this.handleTatumError(error, 'getBalance');
        }
    }

    /**
     * Get ERC-20 token balance
     * @param address - Ethereum address
     * @param tokenContract - ERC-20 token contract address
     * @returns Balance in token units (as string)
     */
    private async getERC20Balance(
        address: string,
        tokenContract: string
    ): Promise<string> {
        try {
            // Tatum API: GET /v3/erc20/balance/{chain}/{address}/{contractAddress}
            const chain = this.isTestnet ? 'ethereum-sepolia' : 'ethereum';
            const response = await this.tatumClient.get(
                `/erc20/balance/${chain}/${address}/${tokenContract}`
            );

            if (!response.data || response.data.balance === undefined) {
                throw new Error('Invalid response from Tatum API');
            }

            // Get token decimals
            const decimals = response.data.decimals || 18;
            const balance = ethers.formatUnits(response.data.balance, decimals);

            this.logger.debug(
                { address, tokenContract, balance, decimals },
                'ERC-20 balance retrieved'
            );

            return balance;
        } catch (error) {
            this.handleTatumError(error, 'getERC20Balance');
        }
    }

    /**
     * Get transaction by address
     * Returns the most recent incoming transaction
     * Note: For ERC-20 tokens, use getERC20TransactionByAddress directly
     * @param address - Ethereum address
     * @returns Transaction details or null
     */
    async getTransactionByAddress(
        address: string
    ): Promise<Transaction | null> {
        this.logger.debug(
            { address },
            'Getting Ethereum transaction by address'
        );

        try {
            // Native ETH transaction using Tatum API
            // Tatum API: GET /v3/ethereum/account/transaction/{address}
            const response = await this.tatumClient.get(
                `/ethereum/account/transaction/${address}`,
                {
                    params: {
                        pageSize: 10,
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
                    tx.to?.toLowerCase() === address.toLowerCase() &&
                    tx.from?.toLowerCase() !== address.toLowerCase()
            );

            if (!incomingTx) {
                this.logger.debug({ address }, 'No incoming transaction found');
                return null;
            }

            // Convert value from Wei to ETH
            const amountEth = ethers.formatEther(incomingTx.value || '0');

            const transaction: Transaction = {
                hash: incomingTx.hash,
                from: incomingTx.from || '',
                to: address,
                amount: amountEth,
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
                'Ethereum transaction found'
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
     * Get ERC-20 token transaction by address
     */
    private async getERC20TransactionByAddress(
        address: string,
        tokenContract: string
    ): Promise<Transaction | null> {
        try {
            const chain = this.isTestnet ? 'ethereum-sepolia' : 'ethereum';
            const response = await this.tatumClient.get(
                `/erc20/transaction/${chain}/${address}/${tokenContract}`,
                {
                    params: {
                        pageSize: 10,
                    },
                }
            );

            if (!response.data || !Array.isArray(response.data)) {
                return null;
            }

            // Find incoming transaction
            const transactions = response.data as any[];
            const incomingTx = transactions.find(
                (tx: any) =>
                    tx.to?.toLowerCase() === address.toLowerCase() &&
                    tx.from?.toLowerCase() !== address.toLowerCase()
            );

            if (!incomingTx) {
                return null;
            }

            // Get token decimals
            const decimals = incomingTx.decimals || 18;
            const amount = ethers.formatUnits(
                incomingTx.value || '0',
                decimals
            );

            const transaction: Transaction = {
                hash: incomingTx.hash || incomingTx.txId,
                from: incomingTx.from || '',
                to: address,
                amount,
                confirmations: incomingTx.blockNumber
                    ? await this.getTransactionConfirmations(
                          incomingTx.hash || incomingTx.txId
                      )
                    : 0,
                blockNumber: incomingTx.blockNumber || undefined,
                timestamp: incomingTx.timestamp || undefined,
            };

            return transaction;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            this.handleTatumError(error, 'getERC20TransactionByAddress');
        }
    }

    /**
     * Get transaction details by hash
     * @param txHash - Transaction hash
     * @returns Transaction details or null
     */
    async getTransaction(txHash: string): Promise<Transaction | null> {
        this.logger.debug({ txHash }, 'Getting Ethereum transaction details');

        try {
            const tx = await this.provider.getTransaction(txHash);
            const receipt = await this.provider.getTransactionReceipt(txHash);

            if (!tx) {
                return null;
            }

            const amountEth = ethers.formatEther(tx.value || '0');

            const transaction: Transaction = {
                hash: tx.hash,
                from: tx.from || '',
                to: tx.to || '',
                amount: amountEth,
                confirmations: await this.getTransactionConfirmations(txHash),
                blockNumber: receipt?.blockNumber || undefined,
                timestamp: undefined, // Would need to fetch block to get timestamp
            };

            return transaction;
        } catch (error) {
            this.logger.warn({ error, txHash }, 'Failed to get transaction');
            return null;
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
            'Getting Ethereum transaction confirmations'
        );

        try {
            // Get transaction receipt using ethers
            const receipt = await this.provider.getTransactionReceipt(txHash);

            if (!receipt || !receipt.blockNumber) {
                return 0;
            }

            // Get current block number
            const currentBlock = await this.provider.getBlockNumber();

            // Calculate confirmations
            const confirmations = Math.max(
                0,
                currentBlock - receipt.blockNumber + 1
            );

            this.logger.debug(
                { txHash, confirmations, blockNumber: receipt.blockNumber },
                'Ethereum confirmations retrieved'
            );

            return confirmations;
        } catch (error) {
            this.logger.warn(
                { error, txHash },
                'Failed to get transaction confirmations'
            );
            return 0;
        }
    }

    /**
     * Estimate network fee for a transaction
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount in ETH
     * @returns Estimated fee in ETH
     */
    async estimateFee(
        from: string,
        to: string,
        amount: string
    ): Promise<string> {
        this.logger.debug({ from, to, amount }, 'Estimating Ethereum fee');

        try {
            // Get current gas price
            const feeData = await this.provider.getFeeData();
            const gasPrice =
                feeData.gasPrice || ethers.parseUnits('50', 'gwei'); // Default to 50 Gwei

            // Estimate gas limit (21000 for ETH transfer, more for contracts)
            const gasLimit = 21000n;

            // Calculate fee
            const feeWei = gasPrice * gasLimit;
            const feeEth = ethers.formatEther(feeWei);

            this.logger.debug(
                {
                    gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
                    gasLimit: gasLimit.toString(),
                    feeEth,
                },
                'Ethereum fee estimated'
            );

            return feeEth;
        } catch (error) {
            this.logger.warn(
                { error: error.message },
                'Failed to estimate fee, using default'
            );
            // Default fallback fee (0.001 ETH)
            return '0.001';
        }
    }

    /**
     * Send transaction (for payment forwarding)
     * Note: For ERC-20 tokens, use sendERC20Transaction directly
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount in ETH
     * @param privateKey - Private key (hex string)
     * @returns Transaction hash
     */
    async sendTransaction(
        from: string,
        to: string,
        amount: string,
        privateKey: string
    ): Promise<string> {
        this.logger.info({ from, to, amount }, 'Sending Ethereum transaction');

        try {
            // Validate addresses
            if (!this.isValidAddress(from) || !this.isValidAddress(to)) {
                throw new Error('Invalid Ethereum address');
            }

            // Create wallet from private key
            const wallet = new ethers.Wallet(privateKey, this.provider);

            // Native ETH transfer
            const tx = await wallet.sendTransaction({
                to,
                value: ethers.parseEther(amount),
            });

            this.logger.info(
                { txHash: tx.hash, from, to, amount },
                'Ethereum transaction sent'
            );

            return tx.hash;
        } catch (error) {
            this.handleTatumError(error, 'sendTransaction');
        }
    }

    /**
     * Send ERC-20 token transaction
     */
    private async sendERC20Transaction(
        wallet: ethers.Wallet,
        to: string,
        amount: string,
        tokenContract: string
    ): Promise<string> {
        // Create ERC-20 contract instance
        const abi = [
            'function transfer(address to, uint256 amount) returns (bool)',
            'function decimals() view returns (uint8)',
        ];

        const contract = new ethers.Contract(tokenContract, abi, wallet);

        // Get token decimals
        const decimals = await contract.decimals();
        const amountWei = ethers.parseUnits(amount, decimals);

        // Send transaction
        const tx = await contract.transfer(to, amountWei);

        this.logger.info(
            { txHash: tx.hash, to, amount, tokenContract },
            'ERC-20 transaction sent'
        );

        return tx.hash;
    }

    /**
     * Validate Ethereum address format
     * @param address - Address to validate
     * @returns True if valid
     */
    isValidAddress(address: string): boolean {
        try {
            return ethers.isAddress(address);
        } catch {
            return false;
        }
    }

    /**
     * Get ERC-20 token contract address by symbol
     * @param symbol - Token symbol (USDT, USDC)
     * @returns Contract address or undefined
     */
    getTokenContractAddress(symbol: string): string | undefined {
        return ERC20_CONTRACTS[symbol.toUpperCase()];
    }

    /**
     * Get ERC-20 token balance (public method)
     * @param address - Ethereum address
     * @param tokenContract - ERC-20 token contract address
     * @returns Balance in token units
     */
    async getERC20BalancePublic(
        address: string,
        tokenContract: string
    ): Promise<string> {
        return this.getERC20Balance(address, tokenContract);
    }

    /**
     * Get ERC-20 token transaction by address (public method)
     * @param address - Ethereum address
     * @param tokenContract - ERC-20 token contract address
     * @returns Transaction details or null
     */
    async getERC20TransactionByAddressPublic(
        address: string,
        tokenContract: string
    ): Promise<Transaction | null> {
        return this.getERC20TransactionByAddress(address, tokenContract);
    }

    /**
     * Send ERC-20 token transaction (public method)
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount in token units
     * @param privateKey - Private key
     * @param tokenContract - ERC-20 token contract address
     * @returns Transaction hash
     */
    async sendERC20TransactionPublic(
        from: string,
        to: string,
        amount: string,
        privateKey: string,
        tokenContract: string
    ): Promise<string> {
        const wallet = new ethers.Wallet(privateKey, this.provider);
        return this.sendERC20Transaction(wallet, to, amount, tokenContract);
    }
}
