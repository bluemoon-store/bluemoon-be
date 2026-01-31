import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/modules/user/user.module';
import { ProductModule } from 'src/modules/product/product.module';
import { CartModule } from 'src/modules/cart/cart.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { OrderModule } from 'src/modules/order/order.module';
import { WorkerModule } from 'src/workers/worker.module';

import { HealthController } from './controllers/health.controller';
@Module({
    imports: [
        // Shared Common Services
        CommonModule,

        // Background Processing
        WorkerModule,

        // Health Check
        TerminusModule,

        // Feature Modules
        UserModule,
        ProductModule,
        CartModule,
        WalletModule,
        OrderModule,
    ],
    controllers: [HealthController],
})
export class AppModule {}
