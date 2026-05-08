export interface IEmailSendParams {
    to: string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}

export interface IEmailSendResult {
    messageId: string;
}

export interface IEmailProviderService {
    send(params: IEmailSendParams): Promise<IEmailSendResult>;
}
