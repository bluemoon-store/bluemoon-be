import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseModule } from 'src/common/database/database.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';

import { SettingsAdminController } from './controllers/settings.admin.controller';
import { SettingsPublicController } from './controllers/settings.public.controller';
import { SettingsService } from './services/settings.service';

@Module({
    imports: [
        DatabaseModule,
        ActivityLogModule,
        BullModule.registerQueue({ name: APP_BULL_QUEUES.EMAIL }),
    ],
    controllers: [SettingsAdminController, SettingsPublicController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule {}
