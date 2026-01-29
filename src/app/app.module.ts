import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/modules/user/user.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
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
        NotificationModule,
    ],
    controllers: [HealthController],
})
export class AppModule {}
