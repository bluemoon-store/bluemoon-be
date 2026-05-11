export interface IResendSendParams {
    to: string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}

export interface IResendSendResult {
    messageId: string;
}

export interface IResendService {
    send(params: IResendSendParams): Promise<IResendSendResult>;
}
