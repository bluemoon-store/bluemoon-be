import { BullModule } from '@nestjs/bull';
import { Module, Scope } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseModule } from 'src/common/database/database.module';

import { ActivityLogAdminController } from './controllers/activity-log.admin.controller';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { ActivityLogProcessor } from './processors/activity-log.processor';
import { ActivityLogEmitterService } from './services/activity-log.emitter.service';
import { ActivityLogService } from './services/activity-log.service';

@Module({
    imports: [
        DatabaseModule,
        BullModule.registerQueue({
            name: APP_BULL_QUEUES.ACTIVITY_LOG,
            defaultJobOptions: {
                attempts: 5,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true,
            },
        }),
    ],
    controllers: [ActivityLogAdminController],
    providers: [
        ActivityLogService,
        ActivityLogEmitterService,
        ActivityLogProcessor,
        {
            provide: APP_INTERCEPTOR,
            scope: Scope.REQUEST,
            useClass: AuditLogInterceptor,
        },
    ],
    exports: [ActivityLogService, ActivityLogEmitterService],
})
export class ActivityLogModule {}
