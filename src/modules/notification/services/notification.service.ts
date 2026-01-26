import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Platform } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

import { DatabaseService } from 'src/common/database/services/database.service';
import { MessageService } from 'src/common/message/services/message.service';

import { FcmService, NotificationPayload } from './fcm.service';
import {
    FcmTokenRemoveResponseDto,
    FcmTokenUpdateResponseDto,
} from '../dtos/response/notification.response';
import { INotificationService } from '../interfaces/notification.service.interface';

@Injectable()
export class NotificationService implements INotificationService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly fcmService: FcmService,
        private readonly messageService: MessageService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(NotificationService.name);
    }

    async updateFcmToken(
        userId: string,
        token: string,
        platform: Platform
    ): Promise<FcmTokenUpdateResponseDto> {
        try {
            // Check if user exists
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Check if token already exists
            const existingToken =
                await this.databaseService.deviceToken.findUnique({
                    where: { token },
                });

            if (existingToken) {
                // Update existing token if it belongs to different user or platform
                if (
                    existingToken.userId !== userId ||
                    existingToken.platform !== platform
                ) {
                    await this.databaseService.deviceToken.update({
                        where: { token },
                        data: {
                            userId,
                            platform,
                            isActive: true,
                        },
                    });
                } else {
                    // Token already exists and is correct, just ensure it's active
                    await this.databaseService.deviceToken.update({
                        where: { token },
                        data: { isActive: true },
                    });
                }
            } else {
                // Create new token
                await this.databaseService.deviceToken.create({
                    data: {
                        userId,
                        token,
                        platform,
                        isActive: true,
                    },
                });
            }

            this.logger.info(
                { userId, token, platform },
                'FCM token updated successfully'
            );

            return {
                success: true,
                message: 'notification.success.fcmTokenUpdated',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                { userId, error: error.message },
                'Failed to update FCM token'
            );
            throw new HttpException(
                'notification.error.failedToUpdateToken',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async removeFcmToken(
        userId: string,
        token: string
    ): Promise<FcmTokenRemoveResponseDto> {
        try {
            const deviceToken =
                await this.databaseService.deviceToken.findUnique({
                    where: { token },
                });

            if (!deviceToken) {
                throw new HttpException(
                    'notification.error.tokenNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            if (deviceToken.userId !== userId) {
                throw new HttpException(
                    'notification.error.unauthorized',
                    HttpStatus.FORBIDDEN
                );
            }

            // Soft delete by marking as inactive
            await this.databaseService.deviceToken.update({
                where: { token },
                data: { isActive: false },
            });

            this.logger.info(
                { userId, token },
                'FCM token removed successfully'
            );

            return {
                success: true,
                message: 'notification.success.fcmTokenRemoved',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                { userId, error: error.message },
                'Failed to remove FCM token'
            );
            throw new HttpException(
                'notification.error.failedToRemoveToken',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async sendWelcomeNotification(userId: string): Promise<void> {
        try {
            const tokens = await this.getUserActiveTokens(userId);
            if (tokens.length === 0) {
                this.logger.info(
                    { userId },
                    'No active tokens found for welcome notification'
                );
                return;
            }

            const notification: NotificationPayload = {
                title: this.messageService.translate(
                    'notification.welcome.title'
                ),
                body: this.messageService.translate(
                    'notification.welcome.body'
                ),
            };

            await this.fcmService.sendToMultipleTokens(tokens, notification);

            this.logger.info(
                { userId, tokenCount: tokens.length },
                'Welcome notification sent'
            );
        } catch (error) {
            this.logger.error(
                { userId, error: error.message },
                'Failed to send welcome notification'
            );
            // Don't throw - welcome notification is not critical
        }
    }

    async sendDailySparksReminder(userId: string): Promise<void> {
        try {
            const tokens = await this.getUserActiveTokens(userId);
            if (tokens.length === 0) {
                this.logger.info(
                    { userId },
                    'No active tokens found for daily sparks reminder'
                );
                return;
            }

            const notification: NotificationPayload = {
                title: this.messageService.translate(
                    'notification.dailySparks.title'
                ),
                body: this.messageService.translate(
                    'notification.dailySparks.body'
                ),
            };

            await this.fcmService.sendToMultipleTokens(tokens, notification);

            this.logger.info(
                { userId, tokenCount: tokens.length },
                'Daily sparks reminder sent'
            );
        } catch (error) {
            this.logger.error(
                { userId, error: error.message },
                'Failed to send daily sparks reminder'
            );
            // Don't throw - reminder is not critical
        }
    }

    private async getUserActiveTokens(userId: string): Promise<string[]> {
        const deviceTokens = await this.databaseService.deviceToken.findMany({
            where: {
                userId,
                isActive: true,
            },
            select: {
                token: true,
            },
        });

        return deviceTokens.map(dt => dt.token);
    }
}
