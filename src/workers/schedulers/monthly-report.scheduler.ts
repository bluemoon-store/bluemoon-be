import { InjectQueue } from '@nestjs/bull';
import { Injectable, Scope } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderStatus, Role } from '@prisma/client';
import { Queue } from 'bull';
import { PinoLogger } from 'nestjs-pino';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseService } from 'src/common/database/services/database.service';
import { EMAIL_TEMPLATES } from 'src/common/email/enums/email-template.enum';
import {
    IMonthlyStoreReportPayload,
    ISendEmailBasePayload,
} from 'src/common/helper/interfaces/email.interface';

const REPORT_RECIPIENT_ROLES: Role[] = [Role.OWNER, Role.SUPER_ADMIN, Role.MOD];

@Injectable({ scope: Scope.DEFAULT })
export class MonthlyReportScheduleWorker {
    constructor(
        private readonly databaseService: DatabaseService,
        @InjectQueue(APP_BULL_QUEUES.EMAIL)
        private readonly emailQueue: Queue,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(MonthlyReportScheduleWorker.name);
    }

    // Fires at 00:00 UTC on the 1st of each month — reports cover the
    // calendar month that just ended.
    @Cron('0 0 1 * *')
    async sendMonthlyStoreReport(): Promise<void> {
        try {
            const now = new Date();
            const periodEnd = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
            );
            const periodStart = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
            );

            const totalOrders = await this.databaseService.order.count({
                where: {
                    status: OrderStatus.COMPLETED,
                    completedAt: { gte: periodStart, lt: periodEnd },
                },
            });

            const revenueAgg = await this.databaseService.order.aggregate({
                where: {
                    status: OrderStatus.COMPLETED,
                    completedAt: { gte: periodStart, lt: periodEnd },
                },
                _sum: { totalAmount: true },
            });

            const totalRevenueNumber = Number(
                revenueAgg._sum.totalAmount?.toString() ?? '0'
            );
            const totalRevenueFormatted = `$${totalRevenueNumber.toLocaleString(
                'en-US',
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`;

            const reportMonth = periodStart.toLocaleString('en-US', {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
            });

            const recipients = await this.databaseService.user.findMany({
                where: {
                    role: { in: REPORT_RECIPIENT_ROLES },
                    deletedAt: null,
                    isBanned: false,
                },
                select: { id: true, email: true },
            });

            if (recipients.length === 0) {
                this.logger.warn(
                    { reportMonth },
                    'No admin recipients found for monthly store report'
                );
                return;
            }

            for (const recipient of recipients) {
                if (!recipient.email) continue;
                this.emailQueue.add(EMAIL_TEMPLATES.MONTHLY_STORE_REPORT, {
                    data: {
                        report_month: reportMonth,
                        total_orders: totalOrders,
                        total_revenue: totalRevenueFormatted,
                    },
                    toEmails: [recipient.email],
                } as ISendEmailBasePayload<IMonthlyStoreReportPayload>);
            }

            this.logger.info(
                {
                    reportMonth,
                    totalOrders,
                    totalRevenue: totalRevenueFormatted,
                    recipients: recipients.length,
                },
                'Monthly store report queued'
            );
        } catch (error) {
            this.logger.error(
                { error: error?.message },
                'Failed to dispatch monthly store report'
            );
        }
    }
}
