import { Body, Controller, Delete, HttpStatus, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { FcmTokenRemoveDto } from '../dtos/request/fcm-token.remove.request';
import { FcmTokenUpdateDto } from '../dtos/request/fcm-token.update.request';
import {
    FcmTokenRemoveResponseDto,
    FcmTokenUpdateResponseDto,
} from '../dtos/response/notification.response';
import { NotificationService } from '../services/notification.service';

@ApiTags('public.notification')
@Controller({
    path: '/notification',
    version: '1',
})
export class NotificationPublicController {
    constructor(private readonly notificationService: NotificationService) {}

    @Put('fcm-token')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update FCM token' })
    @DocResponse({
        serialization: FcmTokenUpdateResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'notification.success.fcmTokenUpdated',
    })
    public async updateFcmToken(
        @AuthUser() user: IAuthUser,
        @Body() payload: FcmTokenUpdateDto
    ): Promise<FcmTokenUpdateResponseDto> {
        return this.notificationService.updateFcmToken(
            user.userId,
            payload.token,
            payload.platform
        );
    }

    @Delete('fcm-token')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Remove FCM token' })
    @DocResponse({
        serialization: FcmTokenRemoveResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'notification.success.fcmTokenRemoved',
    })
    public async removeFcmToken(
        @AuthUser() user: IAuthUser,
        @Body() payload: FcmTokenRemoveDto
    ): Promise<FcmTokenRemoveResponseDto> {
        return this.notificationService.removeFcmToken(
            user.userId,
            payload.token
        );
    }
}
