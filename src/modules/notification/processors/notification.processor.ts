import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';

import { NotificationService } from '../services/notification.service';

interface WelcomeNotificationJob {
    userId: string;
}

interface DailySparksReminderJob {
    userId: string;
}

@Processor(APP_BULL_QUEUES.NOTIFICATION)
export class NotificationProcessorWorker {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(NotificationProcessorWorker.name);
    }

    @Process('welcome')
    async processWelcomeNotification(
        job: Job<WelcomeNotificationJob>
    ): Promise<void> {
        const { userId } = job.data;

        this.logger.info(
            { jobId: job.id, userId },
            'Processing welcome notification job'
        );

        try {
            await this.notificationService.sendWelcomeNotification(userId);

            this.logger.info(
                { jobId: job.id, userId },
                'Welcome notification sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { jobId: job.id, userId, error: error.message },
                `Failed to send welcome notification: ${error.message}`
            );
            throw error;
        }
    }

    @Process('daily-sparks-reminder')
    async processDailySparksReminder(
        job: Job<DailySparksReminderJob>
    ): Promise<void> {
        const { userId } = job.data;

        this.logger.info(
            { jobId: job.id, userId },
            'Processing daily sparks reminder job'
        );

        try {
            await this.notificationService.sendDailySparksReminder(userId);

            this.logger.info(
                { jobId: job.id, userId },
                'Daily sparks reminder sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { jobId: job.id, userId, error: error.message },
                `Failed to send daily sparks reminder: ${error.message}`
            );
            throw error;
        }
    }
}
