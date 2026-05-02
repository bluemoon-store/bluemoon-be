import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';
import { ExchangeRateService } from 'src/modules/crypto-payment/services/exchange-rate.service';
import { SystemWalletService } from 'src/modules/crypto-payment/services/system-wallet.service';

import { WalletPublicController } from './controllers/wallet.public.controller';
import { WalletAdminController } from './controllers/wallet.admin.controller';
import { WalletService } from './services/wallet.service';

@Module({
    imports: [
        CacheModule.register(),
        DatabaseModule,
        HelperModule,
        BullModule.registerQueue({
            name: 'crypto-payment-verification',
        }),
        ActivityLogModule,
    ],
    controllers: [WalletPublicController, WalletAdminController],
    providers: [WalletService, SystemWalletService, ExchangeRateService],
    exports: [WalletService],
})
export class WalletModule {}
