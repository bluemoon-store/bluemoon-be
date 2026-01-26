import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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

    @Cron('0 9 * * *') // Run at 9 AM daily
    async sendDailySparksReminder() {
        this.logger.log('Starting daily sparks reminder job');

        try {
            // Get all active users
            const users = await this.databaseService.user.findMany({
                where: {
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            });

            if (users.length === 0) {
                this.logger.log(
                    'No active users found for daily sparks reminder'
                );
                return;
            }

            // Create jobs for each user
            const jobs = users.map(user => ({
                name: 'daily-sparks-reminder',
                data: { userId: user.id },
            }));

            await this.notificationQueue.addBulk(jobs);

            this.logger.log(
                `Scheduled ${jobs.length} daily sparks reminder notifications`
            );
        } catch (error) {
            this.logger.error(
                { error: error.message },
                'Failed to schedule daily sparks reminders'
            );
        }
    }
}
