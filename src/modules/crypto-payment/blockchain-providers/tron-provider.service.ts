import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { fromHex, toHex } from 'tron-format-address';

import { BaseBlockchainProvider } from './base-blockchain-provider';
import { Transaction } from './blockchain-provider.interface';

/** ERC-20 / TRC-20 Transfer(address,address,uint256) topic0 — same as ethers.id(...). */
const TRANSFER_EVENT_TOPIC =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/** Official USDT TRC-20 on Tron mainnet (Tether). */
const USDT_TRC20_CONTRACT_MAINNET = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

/** Shasta testnet TRC-20 used in Tatum examples (not mainnet USDT). */
const USDT_TRC20_CONTRACT_SHASTA = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';

/** Minimum native TRX (SUN) on payment address before forwarding TRC-20 (15 TRX). */
const MIN_TRX_SUN_FOR_TRC20_FORWARD = 15_000_000;

/** Tatum `feeLimit` for TRC-20 broadcast (SUN). */
const TRC20_FEE_LIMIT_DEFAULT = 100_000_000;

/**
 * Tron blockchain provider for USDT (TRC-20).
 * Uses Tatum REST (same pattern as UTXO providers) for reads and TRC-20 broadcast.
 * Native TRX on the payment address is required to pay energy/bandwidth for transfers.
 */
@Injectable()
export class TronProvider extends BaseBlockchainProvider {
    private readonly usdtContractAddress: string;
    private readonly minTrxSunForForward: number;
    private readonly trc20FeeLimit: number;

    constructor(configService: ConfigService, logger: PinoLogger) {
        super(configService, logger, 'tron');

        this.usdtContractAddress = this.isTestnet
            ? USDT_TRC20_CONTRACT_SHASTA
            : USDT_TRC20_CONTRACT_MAINNET;

        this.minTrxSunForForward = MIN_TRX_SUN_FOR_TRC20_FORWARD;
        this.trc20FeeLimit = TRC20_FEE_LIMIT_DEFAULT;
    }

    /**
     * USDT TRC-20 balance for address (human-readable units, 6 decimals).
     */
    async getBalance(address: string): Promise<string> {
        this.logger.debug({ address }, 'Getting Tron USDT balance');

        try {
            const raw = await this.fetchAccountRaw(address);
            if (!raw) {
                return '0';
            }

            const usdtSun = this.extractUsdtBalanceSun(raw);
            return this.fromSunString(usdtSun, 6);
        } catch (error: any) {
            if (error.response?.status === 404) {
                return '0';
            }
            this.handleTatumError(error, 'getBalance');
        }
    }

    /**
     * Native TRX balance in SUN (smallest unit).
     */
    async getTrxBalanceSun(address: string): Promise<number> {
        try {
            const raw = await this.fetchAccountRaw(address);
            if (!raw || raw.balance === undefined || raw.balance === null) {
                return 0;
            }
            const n =
                typeof raw.balance === 'string'
                    ? parseInt(raw.balance, 10)
                    : Number(raw.balance);
            return Number.isFinite(n) ? n : 0;
        } catch (error: any) {
            this.logger.warn(
                { error: error?.message, address },
                'Failed to get TRX balance, assuming 0'
            );
            return 0;
        }
    }

    private async fetchAccountRaw(address: string): Promise<any | null> {
        try {
            const response = await this.tatumClient.get(
                `/tron/account/${address}`
            );
            return response.data ?? null;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            const msg = String(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    ''
            ).toLowerCase();
            if (
                msg.includes('not found') ||
                msg.includes('unable to find account')
            ) {
                return null;
            }
            throw error;
        }
    }

    private extractUsdtBalanceSun(account: any): string {
        const trc20 = account?.trc20;
        if (!Array.isArray(trc20)) {
            return '0';
        }

        for (const entry of trc20) {
            if (!entry || typeof entry !== 'object') {
                continue;
            }
            for (const [contract, balance] of Object.entries(entry)) {
                if (
                    contract === this.usdtContractAddress &&
                    balance !== undefined &&
                    balance !== null
                ) {
                    return String(balance);
                }
            }
        }
        return '0';
    }

    private fromSunString(raw: string, decimals: number): string {
        try {
            const v = BigInt(raw);
            const d = BigInt(10) ** BigInt(decimals);
            const whole = v / d;
            const frac = v % d;
            if (frac === 0n) {
                return whole.toString();
            }
            const fracStr = frac
                .toString()
                .padStart(decimals, '0')
                .replace(/0+$/, '');
            return `${whole.toString()}.${fracStr}`;
        } catch {
            return '0';
        }
    }

    async getTransactionByAddress(
        address: string
    ): Promise<Transaction | null> {
        this.logger.debug(
            { address },
            'Getting latest incoming USDT TRC-20 transaction'
        );

        try {
            const response = await this.tatumClient.get(
                `/tron/transaction/account/${address}/trc20`,
                {
                    params: {
                        contractAddress: this.usdtContractAddress,
                        onlyTo: true,
                        onlyConfirmed: true,
                        orderBy: 'block_timestamp,desc',
                    },
                }
            );

            const txs = response.data?.transactions;
            if (!Array.isArray(txs) || txs.length === 0) {
                return null;
            }

            const incoming = txs.find((tx: any) => {
                const token = tx?.tokenInfo || tx?.token_info;
                const txId = tx?.txID || tx?.tx_id;
                return (
                    txId &&
                    tx?.to === address &&
                    tx?.from &&
                    tx.from !== address &&
                    token?.address === this.usdtContractAddress
                );
            });

            if (!incoming) {
                return null;
            }

            const token = incoming.tokenInfo || incoming.token_info;
            const decimals = token?.decimals ?? 6;
            const amountHuman = this.fromSunString(
                String(incoming.value || '0'),
                decimals
            );
            const txId = incoming.txID || incoming.tx_id;

            const transaction: Transaction = {
                hash: txId,
                from: incoming.from || '',
                to: incoming.to || address,
                amount: amountHuman,
                confirmations: txId
                    ? await this.getTransactionConfirmations(txId)
                    : 0,
                blockNumber:
                    incoming.blockNumber ?? incoming.block_number ?? undefined,
                timestamp:
                    incoming.block_timestamp != null
                        ? Math.floor(Number(incoming.block_timestamp) / 1000)
                        : undefined,
            };

            return transaction;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            this.handleTatumError(error, 'getTransactionByAddress');
        }
    }

    async getTransaction(txHash: string): Promise<Transaction | null> {
        this.logger.debug({ txHash }, 'Getting Tron transaction');

        try {
            const response = await this.tatumClient.get(
                `/tron/transaction/${txHash}`
            );
            const tx = response.data;
            if (!tx) {
                return null;
            }

            const parsed = this.parseUsdtTransferFromFullTx(tx);
            const confirmations =
                await this.getTransactionConfirmations(txHash);

            if (parsed) {
                return {
                    hash: tx.txID || txHash,
                    from: parsed.from,
                    to: parsed.to,
                    amount: parsed.amount,
                    confirmations,
                    blockNumber: tx.blockNumber || undefined,
                };
            }

            return {
                hash: tx.txID || txHash,
                from: '',
                to: '',
                amount: '0',
                confirmations,
                blockNumber: tx.blockNumber || undefined,
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            this.handleTatumError(error, 'getTransaction');
        }
    }

    private parseUsdtTransferFromFullTx(tx: any): {
        from: string;
        to: string;
        amount: string;
    } | null {
        const contractHex = toHex(this.usdtContractAddress)
            .replace(/^0x/i, '')
            .toLowerCase();

        for (const log of tx.log || []) {
            const topics = log.topics;
            if (!topics?.length) {
                continue;
            }
            if (
                String(topics[0]).toLowerCase() !==
                TRANSFER_EVENT_TOPIC.toLowerCase()
            ) {
                continue;
            }

            const logAddr = String(log.address || '')
                .replace(/^0x/i, '')
                .toLowerCase();
            if (logAddr !== contractHex) {
                continue;
            }

            try {
                const fromTopic = topics[1];
                const toTopic = topics[2];
                const fromEth =
                    '0x' + String(fromTopic).replace(/^0x/i, '').slice(-40);
                const toEth =
                    '0x' + String(toTopic).replace(/^0x/i, '').slice(-40);
                const from = fromHex(fromEth);
                const to = fromHex(toEth);
                const dataHex = String(log.data || '').replace(/^0x/i, '');
                const value = BigInt('0x' + (dataHex || '0'));
                const amount = this.fromSunString(value.toString(), 6);
                return { from, to, amount };
            } catch {
                continue;
            }
        }
        return null;
    }

    async getTransactionConfirmations(txHash: string): Promise<number> {
        this.logger.debug({ txHash }, 'Getting Tron confirmations');

        try {
            const txResponse = await this.tatumClient.get(
                `/tron/transaction/${txHash}`
            );
            const tx = txResponse.data;
            if (!tx?.blockNumber) {
                return 0;
            }

            const infoResponse = await this.tatumClient.get('/tron/info');
            const current = infoResponse.data?.blockNumber;
            if (current === undefined || current === null) {
                return 0;
            }

            return Math.max(0, current - tx.blockNumber + 1);
        } catch (error: any) {
            if (error.response?.status === 404) {
                return 0;
            }
            this.logger.warn(
                { error: error.message, txHash },
                'Failed to get Tron confirmations'
            );
            return 0;
        }
    }

    /**
     * TRC-20 forwarding consumes TRX (energy), not USDT.
     * Returns "0" so callers that subtract fee from USDT balance do not corrupt amounts;
     * use {@link getTrxBalanceSun} + preflight in {@link sendTransaction} for TRX.
     */
    async estimateFee(
        _from: string,
        _to: string,
        _amount: string
    ): Promise<string> {
        return '0';
    }

    async sendTransaction(
        from: string,
        to: string,
        amount: string,
        privateKey: string
    ): Promise<string> {
        this.logger.info({ from, to, amount }, 'Sending USDT TRC-20');

        try {
            if (!this.isValidAddress(from) || !this.isValidAddress(to)) {
                throw new Error('Invalid Tron address');
            }

            const trxSun = await this.getTrxBalanceSun(from);
            if (trxSun < this.minTrxSunForForward) {
                throw new Error(
                    `Insufficient TRX for TRC-20 forwarding on ${from}: need at least ${this.minTrxSunForForward} SUN (${this.minTrxSunForForward / 1_000_000} TRX), have ${trxSun} SUN. Fund the payment address with TRX for network fees.`
                );
            }

            const fromPrivateKey = this.normalizeTronPrivateKey(privateKey);

            const response = await this.tatumClient.post(
                '/tron/trc20/transaction',
                {
                    fromPrivateKey,
                    to,
                    tokenAddress: this.usdtContractAddress,
                    feeLimit: this.trc20FeeLimit,
                    amount,
                }
            );

            const txId = response.data?.txId || response.data?.txID;
            if (!txId) {
                throw new Error('Invalid response from Tatum TRC-20 send');
            }

            this.logger.info({ txHash: txId, from, to, amount }, 'TRC-20 sent');
            return txId;
        } catch (error) {
            this.handleTatumError(error, 'sendTransaction');
        }
    }

    private normalizeTronPrivateKey(privateKey: string): string {
        const hex = privateKey.startsWith('0x')
            ? privateKey.slice(2)
            : privateKey;
        if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
            throw new Error(
                'Invalid Tron private key format (expected 64 hex)'
            );
        }
        return hex;
    }

    isValidAddress(address: string): boolean {
        if (!address || typeof address !== 'string') {
            return false;
        }
        return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
    }
}
