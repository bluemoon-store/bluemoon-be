import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { workerOnlyProviders } from 'src/common/utils/role.util';

import { EmailProcessorWorker } from './processors/email.processor';
import { MidNightScheduleWorker } from './schedulers/midnight.scheduler';
import { NotificationScheduleWorker } from './schedulers/notification.scheduler';

const workers = workerOnlyProviders([
    MidNightScheduleWorker,
    EmailProcessorWorker,
    NotificationScheduleWorker,
]);

@Module({
    imports: [
        HelperModule,
        DatabaseModule,
        BullModule.registerQueue({
            name: APP_BULL_QUEUES.NOTIFICATION,
        }),
    ],
    providers: workers,
    exports: workers,
})
export class WorkerModule {}
