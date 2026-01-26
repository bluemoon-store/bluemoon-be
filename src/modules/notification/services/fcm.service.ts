import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PinoLogger } from 'nestjs-pino';

export interface NotificationPayload {
    title: string;
    body: string;
    imageUrl?: string;
}

@Injectable()
export class FcmService implements OnModuleInit {
    private messaging: admin.messaging.Messaging;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(FcmService.name);
    }

    onModuleInit() {
        try {
            const projectId =
                this.configService.get<string>('firebase.projectId');
            const clientEmail = this.configService.get<string>(
                'firebase.clientEmail'
            );
            const privateKey = this.configService.get<string>(
                'firebase.privateKey'
            );

            if (!projectId || !clientEmail || !privateKey) {
                this.logger.warn(
                    'Firebase credentials not found. Push notifications will be disabled.'
                );
                return;
            }

            const serviceAccount = {
                projectId,
                clientEmail,
                privateKey,
            };

            // Initialize Firebase Admin if not already initialized
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            }

            this.messaging = admin.messaging();
            this.logger.info('Firebase Admin initialized successfully');
        } catch (error) {
            this.logger.error(
                { error: error.message },
                'Failed to initialize Firebase Admin'
            );
        }
    }

    async sendToToken(
        token: string,
        notification: NotificationPayload
    ): Promise<string> {
        if (!this.messaging) {
            throw new Error('Firebase Admin not initialized');
        }

        try {
            const messageId = await this.messaging.send({
                token,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            });

            this.logger.info(
                { token, messageId },
                'Notification sent successfully'
            );
            return messageId;
        } catch (error) {
            this.logger.error(
                { token, error: error.message },
                'Failed to send notification'
            );
            throw error;
        }
    }

    async sendToMultipleTokens(
        tokens: string[],
        notification: NotificationPayload
    ): Promise<admin.messaging.BatchResponse> {
        if (!this.messaging) {
            throw new Error('Firebase Admin not initialized');
        }

        if (tokens.length === 0) {
            this.logger.warn('No tokens provided for notification');
            return {
                successCount: 0,
                failureCount: 0,
                responses: [],
            };
        }

        try {
            const response = await this.messaging.sendEachForMulticast({
                tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            });

            this.logger.info(
                {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    totalTokens: tokens.length,
                },
                'Batch notification sent'
            );

            // Log failed tokens for cleanup
            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                        this.logger.warn(
                            {
                                token: tokens[idx],
                                error: resp.error?.message,
                            },
                            'Failed to send notification to token'
                        );
                    }
                });
                // You might want to mark these tokens as inactive in the database
            }

            return response;
        } catch (error) {
            this.logger.error(
                { error: error.message, tokenCount: tokens.length },
                'Failed to send batch notifications'
            );
            throw error;
        }
    }
}
