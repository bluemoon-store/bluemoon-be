import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule,
        BullModule.registerQueue({
            name: 'crypto-payment-verification',
        }),
        BullModule.registerQueue({
            name: 'crypto-payment-forwarding',
        }),
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class CryptoPaymentModule {}
