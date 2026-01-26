import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { CommonModule } from 'src/common/common.module';
import { PostModule } from 'src/modules/post/post.module';
import { UserModule } from 'src/modules/user/user.module';
import { EnergyMapModule } from 'src/modules/energy-map/energy-map.module';
import { SparkModule } from 'src/modules/spark/spark.module';
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
        PostModule,
        UserModule,
        SparkModule,
        EnergyMapModule,
        NotificationModule,
    ],
    controllers: [HealthController],
})
export class AppModule {}
