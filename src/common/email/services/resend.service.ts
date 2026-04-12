import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';

import {
    IResendSendParams,
    IResendSendResult,
    IResendService,
} from '../interfaces/resend.service.interface';

@Injectable()
export class ResendService implements IResendService {
    private readonly resend: Resend;
    private readonly defaultFrom: string;
    private readonly testMode: boolean;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(ResendService.name);

        const apiKey = this.configService.getOrThrow<string>('resend.apiKey');
        this.defaultFrom =
            this.configService.getOrThrow<string>('resend.fromEmail');
        this.testMode =
            this.configService.get<boolean>('resend.testMode') ?? false;
        if (this.testMode) {
            this.logger.warn(
                'Resend test mode active — recipients will be redirected'
            );
        }

        this.resend = new Resend(apiKey);
        this.logger.info('Resend service initialized');
    }

    private toTestRecipient(email: string): string {
        const localPart = email.split('@')[0];
        return `delivered+${localPart}@resend.dev`;
    }

    async send(params: IResendSendParams): Promise<IResendSendResult> {
        const from = params.from ?? this.defaultFrom;
        const to = this.testMode
            ? params.to.map(email => this.toTestRecipient(email))
            : params.to;

        const { data, error } = await this.resend.emails.send({
            from,
            to,
            subject: params.subject,
            html: params.html,
            ...(params.replyTo !== undefined
                ? { replyTo: params.replyTo }
                : {}),
        });

        if (error) {
            this.logger.error(
                { message: error.message, name: error.name },
                'Resend send failed'
            );
            throw new Error(error.message);
        }

        this.logger.info(
            { messageId: data.id, recipients: to.length, to },
            'Email sent via Resend'
        );

        return { messageId: data.id };
    }
}
