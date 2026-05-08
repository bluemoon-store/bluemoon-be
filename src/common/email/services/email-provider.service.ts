import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import {
    IEmailProviderService,
    IEmailSendParams,
    IEmailSendResult,
} from '../interfaces/email-provider.service.interface';

import { initSendPulse, smtpSendMail } from './sendpulse-client';

@Injectable()
export class EmailProviderService implements IEmailProviderService {
    private readonly defaultFromEmail: string;
    private readonly defaultFromName: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(EmailProviderService.name);

        const userId = this.configService.getOrThrow<string>(
            'email.sendpulse.apiUserId'
        );
        const secret = this.configService.getOrThrow<string>(
            'email.sendpulse.apiSecret'
        );
        const tokenStorage = this.configService.getOrThrow<string>(
            'email.sendpulse.tokenStorage'
        );
        this.defaultFromEmail =
            this.configService.getOrThrow<string>('email.fromEmail');
        this.defaultFromName =
            this.configService.getOrThrow<string>('email.fromName');

        initSendPulse(userId, secret, tokenStorage);
        this.logger.info('SendPulse email provider initialized');
    }

    async send(params: IEmailSendParams): Promise<IEmailSendResult> {
        const fromEmail = params.from ?? this.defaultFromEmail;

        const response = await smtpSendMail({
            html: params.html,
            text: this.deriveText(params.html),
            subject: params.subject,
            from: { name: this.defaultFromName, email: fromEmail },
            to: params.to.map(email => ({ email })),
            ...(params.replyTo ? { reply_to: params.replyTo } : {}),
        });

        this.logger.info(
            { messageId: response.id, recipients: params.to.length },
            'Email sent via SendPulse'
        );

        return { messageId: response.id! };
    }

    private deriveText(html: string): string {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
