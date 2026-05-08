import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';

import { LegalAdminController } from './controllers/legal.admin.controller';
import { LegalPublicController } from './controllers/legal.public.controller';
import { LegalService } from './services/legal.service';

@Module({
    imports: [DatabaseModule, ActivityLogModule],
    controllers: [LegalAdminController, LegalPublicController],
    providers: [LegalService],
    exports: [LegalService],
})
export class LegalModule {}
