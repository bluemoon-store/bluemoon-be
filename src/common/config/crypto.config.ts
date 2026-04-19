import { registerAs } from '@nestjs/config';

export default registerAs(
    'crypto',
    (): Record<string, any> => ({
        appEnv: process.env.APP_ENV ?? 'local',

        // Blockchain RPC URLs - Use Tatum for unified API
        rpc: {
            bitcoin: process.env.BITCOIN_RPC_URL || '',
            ethereum: process.env.ETHEREUM_RPC_URL || '',
            litecoin: process.env.LITECOIN_RPC_URL || '',
            bitcoinCash: process.env.BITCOIN_CASH_RPC_URL || '',
            tron: process.env.TRON_RPC_URL || '',
        },

        // Tatum API Configuration
        tatum: {
            apiKey: process.env.TATUM_API_KEY || '',
            baseUrl: process.env.TATUM_BASE_URL || 'https://api.tatum.io/v3',
            testnet: process.env.TATUM_TESTNET === 'true',
        },

        // Kraken API Configuration (for exchange rates)
        kraken: {
            apiKey: process.env.KRAKEN_API_KEY || '',
            apiSecret: process.env.KRAKEN_API_SECRET || '',
            baseUrl:
                process.env.KRAKEN_BASE_URL ||
                'https://api.kraken.com/0/public',
        },

        // System HD Wallet Mnemonics (HIGHLY SENSITIVE - use secrets manager)
        mnemonics: {
            btc: process.env.SYSTEM_MNEMONIC_BTC || '',
            eth: process.env.SYSTEM_MNEMONIC_ETH || '',
            ltc: process.env.SYSTEM_MNEMONIC_LTC || '',
            bch: process.env.SYSTEM_MNEMONIC_BCH || '',
            trx: process.env.SYSTEM_MNEMONIC_TRX || '',
        },

        // Platform Wallet Addresses (where payments are forwarded)
        platformWallets: {
            btc: process.env.PLATFORM_WALLET_BTC || '',
            eth: process.env.PLATFORM_WALLET_ETH || '',
            ltc: process.env.PLATFORM_WALLET_LTC || '',
            bch: process.env.PLATFORM_WALLET_BCH || '',
            trx: process.env.PLATFORM_WALLET_TRX || '',
        },

        // Encryption Configuration
        encryption: {
            key: process.env.WALLET_ENCRYPTION_KEY || '',
            algorithm: 'aes-256-gcm',
            keyLength: 32, // 256 bits
            ivLength: 12, // 96 bits
            saltLength: 16,
            iterations: 100000, // PBKDF2 iterations
        },

        // Payment Settings
        payment: {
            expirationMinutes: parseInt(
                process.env.PAYMENT_EXPIRATION_MINUTES || '15',
                10
            ),
            expirationGracePeriodMinutes: parseInt(
                process.env.PAYMENT_EXPIRATION_GRACE_PERIOD_MINUTES || '30',
                10
            ), // Check for funds 30 min after expiration
            monitorIntervalSeconds: parseInt(
                process.env.PAYMENT_MONITOR_INTERVAL_SECONDS || '60',
                10
            ),
            partialPaymentTolerancePercent: parseFloat(
                process.env.PARTIAL_PAYMENT_TOLERANCE_PERCENT || '1.0'
            ), // Accept if payment is within 1% of expected
            maxForwardingRetries: parseInt(
                process.env.MAX_FORWARDING_RETRIES || '5',
                10
            ),
        },

        // Confirmation Requirements
        confirmations: {
            btc: parseInt(process.env.MIN_CONFIRMATIONS_BTC || '3', 10),
            eth: parseInt(process.env.MIN_CONFIRMATIONS_ETH || '12', 10),
            ltc: parseInt(process.env.MIN_CONFIRMATIONS_LTC || '6', 10),
            bch: parseInt(process.env.MIN_CONFIRMATIONS_BCH || '6', 10),
            usdtErc20: parseInt(
                process.env.MIN_CONFIRMATIONS_USDT_ERC20 || '12',
                10
            ),
            usdtTrc20: parseInt(
                process.env.MIN_CONFIRMATIONS_USDT_TRC20 || '19',
                10
            ),
            usdcErc20: parseInt(
                process.env.MIN_CONFIRMATIONS_USDC_ERC20 || '12',
                10
            ),
        },

        // Network Settings
        networks: {
            bitcoin: {
                mainnet: 'mainnet',
                testnet: 'testnet',
                current:
                    process.env.BITCOIN_NETWORK ||
                    process.env.APP_ENV === 'production'
                        ? 'mainnet'
                        : 'testnet',
            },
            ethereum: {
                mainnet: 'mainnet',
                testnet: 'sepolia',
                current:
                    process.env.ETHEREUM_NETWORK ||
                    process.env.APP_ENV === 'production'
                        ? 'mainnet'
                        : 'sepolia',
            },
            litecoin: {
                mainnet: 'mainnet',
                testnet: 'testnet',
                current:
                    process.env.LITECOIN_NETWORK ||
                    process.env.APP_ENV === 'production'
                        ? 'mainnet'
                        : 'testnet',
            },
            tron: {
                mainnet: 'mainnet',
                testnet: 'shasta',
                current:
                    process.env.TRON_NETWORK ||
                    process.env.APP_ENV === 'production'
                        ? 'mainnet'
                        : 'shasta',
            },
        },

        // Exchange Rate Cache TTL (seconds)
        exchangeRateCacheTTL: parseInt(
            process.env.EXCHANGE_RATE_CACHE_TTL || '300',
            10
        ), // 5 minutes

        // Gas Settings (for Ethereum-based transactions)
        gas: {
            maxGasPrice: process.env.MAX_GAS_PRICE || '100', // Gwei
            gasLimit: process.env.GAS_LIMIT || '21000',
        },
    })
);
