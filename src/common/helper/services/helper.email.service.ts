import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { PinoLogger } from 'nestjs-pino';

import {
    EMAIL_TEMPLATES,
    EMAIL_TEMPLATE_SUBJECTS,
} from 'src/common/email/enums/email-template.enum';
import { ResendService } from 'src/common/email/services/resend.service';

import { ISendEmailParams } from '../interfaces/email.interface';
import {
    IEmailSendResult,
    IHelperEmailService,
} from '../interfaces/email.service.interface';

@Injectable()
export class HelperEmailService implements IHelperEmailService {
    private readonly compiledTemplates = new Map<
        EMAIL_TEMPLATES,
        Handlebars.TemplateDelegate
    >();

    constructor(
        private readonly resendService: ResendService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(HelperEmailService.name);
    }

    async sendEmail({
        emailType,
        emails,
        payload,
    }: ISendEmailParams): Promise<IEmailSendResult> {
        const subject = this.resolveSubject(emailType);
        const html = this.renderTemplate(emailType, payload ?? {});

        return this.resendService.send({
            to: emails,
            subject,
            html,
        });
    }

    private resolveSubject(emailType: EMAIL_TEMPLATES): string {
        const subjects: Record<EMAIL_TEMPLATES, string> = {
            [EMAIL_TEMPLATES.WELCOME_EMAIL]:
                EMAIL_TEMPLATE_SUBJECTS.WELCOME_EMAIL,
            [EMAIL_TEMPLATES.FORGOT_PASSWORD_OTP]:
                EMAIL_TEMPLATE_SUBJECTS.FORGOT_PASSWORD_OTP,
            [EMAIL_TEMPLATES.VERIFY_EMAIL]:
                EMAIL_TEMPLATE_SUBJECTS.VERIFY_EMAIL,
            [EMAIL_TEMPLATES.RESET_PASSWORD_LINK]:
                EMAIL_TEMPLATE_SUBJECTS.RESET_PASSWORD_LINK,
            [EMAIL_TEMPLATES.TEAM_INVITATION]:
                EMAIL_TEMPLATE_SUBJECTS.TEAM_INVITATION,
        };
        const subject = subjects[emailType];
        if (!subject) {
            throw new Error(`Unknown email template: ${emailType}`);
        }
        return subject;
    }

    private renderTemplate(
        emailType: EMAIL_TEMPLATES,
        payload: Record<string, any>
    ): string {
        let compiled = this.compiledTemplates.get(emailType);

        if (!compiled) {
            const templatePath = path.join(
                __dirname,
                '../../email/templates',
                `${emailType}.hbs`
            );
            const source = fs.readFileSync(templatePath, 'utf8');
            compiled = Handlebars.compile(source);
            this.compiledTemplates.set(emailType, compiled);
        }

        return compiled(payload);
    }
}
