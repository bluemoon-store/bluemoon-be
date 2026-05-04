import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';

import { StockLineService } from '../services/stock-line.service';

@Injectable()
export class StockLineStaleReservationSweeper {
    constructor(
        private readonly stockLineService: StockLineService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(StockLineStaleReservationSweeper.name);
    }

    @Cron('*/3 * * * *')
    async releaseStaleReservedLines(): Promise<void> {
        const n = await this.stockLineService.releaseAllStaleReservedLines();
        if (n > 0) {
            this.logger.info(
                { releasedOrderItemBatches: n },
                'Released stale RESERVED stock lines'
            );
        }
    }
}
