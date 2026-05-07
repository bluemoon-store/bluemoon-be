import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from 'src/common/database/database.module';
import { workerOnlyProviders } from 'src/common/utils/role.util';

import { StockLineAdminController } from './controllers/stock-line.admin.controller';
import { StockLineStaleReservationSweeper } from './schedulers/stock-line-stale-reservation.sweeper';
import { StockLineService } from './services/stock-line.service';

@Module({
    imports: [DatabaseModule, ConfigModule],
    controllers: [StockLineAdminController],
    providers: [
        StockLineService,
        ...workerOnlyProviders([StockLineStaleReservationSweeper]),
    ],
    exports: [StockLineService],
})
export class StockLineModule {}
