import * as sendpulse from 'sendpulse-api';

export interface SendPulseEmailPayload {
    html: string;
    text: string;
    subject: string;
    from: { name: string; email: string };
    to: { name?: string; email: string }[];
    reply_to?: string;
}

export interface SendPulseSendResponse {
    result: boolean;
    id?: string;
    message?: string;
}

let initialized = false;

export function initSendPulse(
    userId: string,
    secret: string,
    tokenStorage: string
): void {
    if (initialized) return;
    sendpulse.init(userId, secret, tokenStorage, () => {
        // noop — token is fetched lazily by the SDK on first call
    });
    initialized = true;
}

export function smtpSendMail(
    payload: SendPulseEmailPayload
): Promise<SendPulseSendResponse> {
    return new Promise((resolve, reject) => {
        sendpulse.smtpSendMail((response: SendPulseSendResponse) => {
            if (response && response.result === true && response.id) {
                resolve(response);
            } else {
                reject(
                    new Error(
                        response?.message ?? 'SendPulse send failed (no result)'
                    )
                );
            }
        }, payload);
    });
}
