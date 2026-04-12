import { ISendEmailParams } from './email.interface';

export interface IEmailSendResult {
    messageId: string;
}

export interface IHelperEmailService {
    sendEmail(payload: ISendEmailParams): Promise<IEmailSendResult>;
}
