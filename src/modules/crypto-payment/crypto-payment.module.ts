import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { CommonModule } from 'src/common/common.module';
import { CustomLoggerModule } from 'src/common/logger/logger.module';
import { SystemWalletService } from './services/system-wallet.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { CryptoPaymentService } from './services/crypto-payment.service';
import { BlockchainMonitorService } from './services/blockchain-monitor.service';
import { PaymentForwardingService } from './services/payment-forwarding.service';

// Blockchain Providers
import { BitcoinProvider } from './blockchain-providers/bitcoin-provider.service';
import { EthereumProvider } from './blockchain-providers/ethereum-provider.service';
import { LitecoinProvider } from './blockchain-providers/litecoin-provider.service';
import { BitcoinCashProvider } from './blockchain-providers/bitcoin-cash-provider.service';
import { BlockchainProviderFactory } from './blockchain-providers/blockchain-provider.factory';

// Processors
import { PaymentVerificationProcessor } from './processors/payment-verification.processor';
import { PaymentForwardingProcessor } from './processors/payment-forwarding.processor';

// Controllers
import {
    CryptoPaymentPublicController,
    CryptoPublicController,
} from './controllers/crypto-payment.public.controller';
import { CryptoPaymentAdminController } from './controllers/crypto-payment.admin.controller';

@Module({
    imports: [
        ConfigModule,
        CommonModule, // Provides DatabaseService and CacheManager
        CustomLoggerModule, // Provides PinoLogger
        ScheduleModule.forRoot(), // For cron jobs
        BullModule.registerQueue({
            name: 'crypto-payment-verification',
        }),
        BullModule.registerQueue({
            name: 'crypto-payment-forwarding',
        }),
    ],
    controllers: [
        CryptoPaymentPublicController,
        CryptoPublicController,
        CryptoPaymentAdminController,
    ],
    providers: [
        // Core Services
        SystemWalletService,
        ExchangeRateService,
        CryptoPaymentService,
        BlockchainMonitorService,
        PaymentForwardingService,
        // Blockchain Providers
        BitcoinProvider,
        EthereumProvider,
        LitecoinProvider,
        BitcoinCashProvider,
        // Factory
        BlockchainProviderFactory,
        // Processors
        PaymentVerificationProcessor,
        PaymentForwardingProcessor,
    ],
    exports: [
        SystemWalletService,
        ExchangeRateService,
        CryptoPaymentService,
        BlockchainMonitorService,
        PaymentForwardingService,
        BlockchainProviderFactory,
    ],
})
export class CryptoPaymentModule {}
