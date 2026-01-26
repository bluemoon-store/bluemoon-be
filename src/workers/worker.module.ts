import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';

import { EmailProcessorWorker } from './processors/email.processor';
import { MidNightScheduleWorker } from './schedulers/midnight.scheduler';
import { NotificationScheduleWorker } from './schedulers/notification.scheduler';

@Module({
    imports: [
        HelperModule,
        DatabaseModule,
        ScheduleModule.forRoot(),
        BullModule.registerQueue({
            name: APP_BULL_QUEUES.NOTIFICATION,
        }),
    ],
    providers: [
        MidNightScheduleWorker,
        EmailProcessorWorker,
        NotificationScheduleWorker,
    ],
    exports: [
        MidNightScheduleWorker,
        EmailProcessorWorker,
        NotificationScheduleWorker,
    ],
})
export class WorkerModule {}
