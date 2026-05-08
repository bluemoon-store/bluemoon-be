import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
    provider: 'sendpulse',
    fromEmail: process.env.EMAIL_FROM_EMAIL,
    fromName: process.env.EMAIL_FROM_NAME ?? 'Jinx.to',
    sendpulse: {
        apiUserId: process.env.SENDPULSE_API_USER_ID,
        apiSecret: process.env.SENDPULSE_API_SECRET,
        tokenStorage: process.env.SENDPULSE_TOKEN_STORAGE ?? '/tmp/',
    },
}));
