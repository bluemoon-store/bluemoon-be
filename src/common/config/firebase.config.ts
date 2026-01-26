import { registerAs } from '@nestjs/config';

/**
 * Firebase Configuration
 *
 * This configuration supports Firebase Cloud Messaging (FCM) for push notifications.
 *
 * Environment variables:
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_CLIENT_EMAIL: Firebase service account email
 * - FIREBASE_PRIVATE_KEY: Firebase service account private key (should be base64 encoded or escaped)
 */
export default registerAs(
    'firebase',
    (): Record<string, any> => ({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
);
