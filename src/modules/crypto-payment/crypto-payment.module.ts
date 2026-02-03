import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from 'src/common/common.module';
import { CustomLoggerModule } from 'src/common/logger/logger.module';
import { SystemWalletService } from './services/system-wallet.service';

@Module({
    imports: [
        ConfigModule,
        CommonModule, // Provides DatabaseService
        CustomLoggerModule, // Provides PinoLogger
        BullModule.registerQueue({
            name: 'crypto-payment-verification',
        }),
        BullModule.registerQueue({
            name: 'crypto-payment-forwarding',
        }),
    ],
    controllers: [],
    providers: [SystemWalletService],
    exports: [SystemWalletService],
})
export class CryptoPaymentModule {}
