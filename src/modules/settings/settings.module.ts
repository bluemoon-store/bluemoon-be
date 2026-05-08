import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';

import { SettingsAdminController } from './controllers/settings.admin.controller';
import { SettingsPublicController } from './controllers/settings.public.controller';
import { SettingsService } from './services/settings.service';

@Module({
    imports: [DatabaseModule, ActivityLogModule],
    controllers: [SettingsAdminController, SettingsPublicController],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule {}
