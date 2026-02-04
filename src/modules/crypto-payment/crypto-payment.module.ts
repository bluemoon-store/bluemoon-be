import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from 'src/common/common.module';
import { CustomLoggerModule } from 'src/common/logger/logger.module';
import { SystemWalletService } from './services/system-wallet.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { CryptoPaymentService } from './services/crypto-payment.service';
import { BlockchainMonitorService } from './services/blockchain-monitor.service';

// Blockchain Providers
import { BitcoinProvider } from './blockchain-providers/bitcoin-provider.service';
import { EthereumProvider } from './blockchain-providers/ethereum-provider.service';
import { LitecoinProvider } from './blockchain-providers/litecoin-provider.service';
import { BitcoinCashProvider } from './blockchain-providers/bitcoin-cash-provider.service';
import { BlockchainProviderFactory } from './blockchain-providers/blockchain-provider.factory';

@Module({
    imports: [
        ConfigModule,
        CommonModule, // Provides DatabaseService and CacheManager
        CustomLoggerModule, // Provides PinoLogger
        BullModule.registerQueue({
            name: 'crypto-payment-verification',
        }),
        BullModule.registerQueue({
            name: 'crypto-payment-forwarding',
        }),
    ],
    controllers: [],
    providers: [
        // Core Services
        SystemWalletService,
        ExchangeRateService,
        CryptoPaymentService,
        BlockchainMonitorService,
        // Blockchain Providers
        BitcoinProvider,
        EthereumProvider,
        LitecoinProvider,
        BitcoinCashProvider,
        // Factory
        BlockchainProviderFactory,
    ],
    exports: [
        SystemWalletService,
        ExchangeRateService,
        CryptoPaymentService,
        BlockchainMonitorService,
        BlockchainProviderFactory,
    ],
})
export class CryptoPaymentModule {}
