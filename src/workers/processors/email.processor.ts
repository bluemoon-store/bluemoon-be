import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { EMAIL_TEMPLATES } from 'src/common/email/enums/email-template.enum';
import {
    IForgotPasswordOtpPayload,
    IResetPasswordLinkPayload,
    ISendEmailBasePayload,
    IVerifyEmailPayload,
    IWelcomeEmailDataPayload,
} from 'src/common/helper/interfaces/email.interface';
import { HelperEmailService } from 'src/common/helper/services/helper.email.service';

@Processor(APP_BULL_QUEUES.EMAIL)
export class EmailProcessorWorker {
    constructor(
        private readonly helperEmailService: HelperEmailService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(EmailProcessorWorker.name);
    }

    @Process(EMAIL_TEMPLATES.WELCOME_EMAIL)
    async processWelcomeEmails(
        job: Job<ISendEmailBasePayload<IWelcomeEmailDataPayload>>
    ) {
        const { toEmails, data } = job.data;

        this.logger.info(
            { jobId: job.id, recipients: toEmails.length },
            'Processing welcome email job'
        );

        try {
            await this.helperEmailService.sendEmail({
                emails: toEmails,
                emailType: EMAIL_TEMPLATES.WELCOME_EMAIL,
                payload: data,
            });

            this.logger.info(
                { jobId: job.id, recipients: toEmails.length },
                'Welcome emails sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { jobId: job.id, error: error.message },
                `Failed to send welcome emails: ${error.message}`
            );
            throw error;
        }
    }

    @Process(EMAIL_TEMPLATES.FORGOT_PASSWORD_OTP)
    async processForgotPasswordOtp(
        job: Job<ISendEmailBasePayload<IForgotPasswordOtpPayload>>
    ) {
        const { toEmails, data } = job.data;

        this.logger.info(
            { jobId: job.id, recipients: toEmails.length },
            'Processing forgot-password OTP email job'
        );

        try {
            await this.helperEmailService.sendEmail({
                emails: toEmails,
                emailType: EMAIL_TEMPLATES.FORGOT_PASSWORD_OTP,
                payload: data,
            });

            this.logger.info(
                { jobId: job.id, recipients: toEmails.length },
                'Forgot-password OTP emails sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { jobId: job.id, error: error.message },
                `Failed to send forgot-password OTP emails: ${error.message}`
            );
            throw error;
        }
    }

    @Process(EMAIL_TEMPLATES.VERIFY_EMAIL)
    async processVerifyEmail(
        job: Job<ISendEmailBasePayload<IVerifyEmailPayload>>
    ) {
        const { toEmails, data } = job.data;

        this.logger.info(
            { jobId: job.id, recipients: toEmails.length },
            'Processing verify-email job'
        );

        try {
            await this.helperEmailService.sendEmail({
                emails: toEmails,
                emailType: EMAIL_TEMPLATES.VERIFY_EMAIL,
                payload: data,
            });

            this.logger.info(
                { jobId: job.id, recipients: toEmails.length },
                'Verify-email messages sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { jobId: job.id, error: error.message },
                `Failed to send verify-email: ${error.message}`
            );
            throw error;
        }
    }

    @Process(EMAIL_TEMPLATES.RESET_PASSWORD_LINK)
    async processResetPasswordLink(
        job: Job<ISendEmailBasePayload<IResetPasswordLinkPayload>>
    ) {
        const { toEmails, data } = job.data;

        this.logger.info(
            { jobId: job.id, recipients: toEmails.length },
            'Processing reset-password-link email job'
        );

        try {
            await this.helperEmailService.sendEmail({
                emails: toEmails,
                emailType: EMAIL_TEMPLATES.RESET_PASSWORD_LINK,
                payload: data,
            });

            this.logger.info(
                { jobId: job.id, recipients: toEmails.length },
                'Reset-password-link emails sent successfully'
            );
        } catch (error) {
            this.logger.error(
                { jobId: job.id, error: error.message },
                `Failed to send reset-password-link emails: ${error.message}`
            );
            throw error;
        }
    }
}
