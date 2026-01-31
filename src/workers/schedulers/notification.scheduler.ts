import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, Scope } from '@nestjs/common';
import { Queue } from 'bull';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseService } from 'src/common/database/services/database.service';

@Injectable({ scope: Scope.DEFAULT })
export class NotificationScheduleWorker {
    private readonly logger = new Logger(NotificationScheduleWorker.name);

    constructor(
        @InjectQueue(APP_BULL_QUEUES.NOTIFICATION)
        private readonly notificationQueue: Queue,
        private readonly databaseService: DatabaseService
    ) {}
}
