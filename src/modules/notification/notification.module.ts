import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseModule } from 'src/common/database/database.module';
import { MessageModule } from 'src/common/message/message.module';

import { NotificationPublicController } from './controllers/notification.public.controller';
import { NotificationProcessorWorker } from './processors/notification.processor';
import { FcmService } from './services/fcm.service';
import { NotificationService } from './services/notification.service';

@Module({
    imports: [
        DatabaseModule,
        MessageModule,
        BullModule.registerQueue({
            name: APP_BULL_QUEUES.NOTIFICATION,
        }),
    ],
    controllers: [NotificationPublicController],
    providers: [NotificationService, FcmService, NotificationProcessorWorker],
    exports: [NotificationService, FcmService],
})
export class NotificationModule {}
