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

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(ResendService.name);

        const apiKey = this.configService.getOrThrow<string>('resend.apiKey');
        const fromEmail =
            this.configService.getOrThrow<string>('resend.fromEmail');
        const fromName = this.configService.get<string>('resend.fromName');

        this.defaultFrom = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        this.resend = new Resend(apiKey);
        this.logger.info('Resend service initialized');
    }

    async send(params: IResendSendParams): Promise<IResendSendResult> {
        const from = params.from ?? this.defaultFrom;
        const to = params.to;

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
