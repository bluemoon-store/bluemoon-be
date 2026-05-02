import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';

import { IActivityLogJobPayload } from '../interfaces/activity-log-job.interface';
import { ActivityLogService } from '../services/activity-log.service';

@Processor(APP_BULL_QUEUES.ACTIVITY_LOG)
export class ActivityLogProcessor {
    constructor(
        private readonly activityLogService: ActivityLogService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(ActivityLogProcessor.name);
    }

    @Process('persist')
    async handlePersist(job: Job<IActivityLogJobPayload>): Promise<void> {
        try {
            await this.activityLogService.persist(job.data);
        } catch (error: any) {
            const maxAttempts = job.opts.attempts ?? 1;
            const attempt = job.attemptsMade + 1;
            this.logger.error(
                {
                    jobId: job.id,
                    attempt,
                    maxAttempts,
                    err: error?.message,
                    action: job.data.action,
                },
                'Activity log persist attempt failed'
            );
            if (attempt >= maxAttempts) {
                this.logger.error(
                    { jobId: job.id, action: job.data.action },
                    'Activity log job exceeded retries (dead letter)'
                );
            }
            throw error;
        }
    }
}
