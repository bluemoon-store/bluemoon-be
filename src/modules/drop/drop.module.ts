import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';
import { StockLineModule } from 'src/modules/stock-line/stock-line.module';

import { DropAdminController } from './controllers/drop.admin.controller';
import { DropPublicController } from './controllers/drop.public.controller';
import { DropService } from './services/drop.service';

@Module({
    imports: [HelperModule, DatabaseModule, ActivityLogModule, StockLineModule],
    controllers: [DropAdminController, DropPublicController],
    providers: [DropService],
    exports: [DropService],
})
export class DropModule {}
