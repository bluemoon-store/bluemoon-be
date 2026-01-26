import { Platform } from '@prisma/client';
import {
    FcmTokenUpdateResponseDto,
    FcmTokenRemoveResponseDto,
} from '../dtos/response/notification.response';

export interface INotificationService {
    updateFcmToken(
        userId: string,
        token: string,
        platform: Platform
    ): Promise<FcmTokenUpdateResponseDto>;

    removeFcmToken(
        userId: string,
        token: string
    ): Promise<FcmTokenRemoveResponseDto>;

    sendWelcomeNotification(userId: string): Promise<void>;

    sendDailySparksReminder(userId: string): Promise<void>;
}
