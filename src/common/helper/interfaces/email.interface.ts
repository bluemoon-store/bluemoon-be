import { EMAIL_TEMPLATES } from 'src/common/email/enums/email-template.enum';

export interface ISendEmailParams {
    emailType: EMAIL_TEMPLATES;
    emails: string[];
    payload: Record<string, any>;
}

export interface ISendEmailBasePayload<T> {
    data: T;
    toEmails: string[];
}

export interface IWelcomeEmailDataPayload {
    userName: string;
}

export interface IForgotPasswordOtpPayload {
    otp: string;
    userName: string;
}

export interface IResetPasswordLinkPayload {
    resetUrl: string;
    userName: string;
}

export interface IVerifyEmailPayload {
    verificationUrl: string;
    userName: string;
}
