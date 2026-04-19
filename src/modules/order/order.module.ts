import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { RequestModule } from 'src/common/request/request.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { StorageModule } from 'src/common/storage/storage.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { CartModule } from 'src/modules/cart/cart.module';

import { OrderPublicController } from './controllers/order.public.controller';
import { OrderAdminController } from './controllers/order.admin.controller';
import { OrderService } from './services/order.service';
import { OrderDeliveryService } from './services/order-delivery.service';

@Module({
    imports: [
        DatabaseModule,
        HelperModule,
        StorageModule,
        WalletModule,
        CartModule,
        RequestModule,
    ],
    controllers: [OrderPublicController, OrderAdminController],
    providers: [OrderService, OrderDeliveryService],
    exports: [OrderService, OrderDeliveryService],
})
export class OrderModule {}
