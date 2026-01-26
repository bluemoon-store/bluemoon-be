import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';

export class FcmTokenUpdateResponseDto {
    @ApiProperty({
        example: true,
    })
    @Expose()
    @IsBoolean()
    success: boolean;

    @ApiProperty({
        example: 'notification.success.fcmTokenUpdated',
    })
    @Expose()
    message: string;
}

export class FcmTokenRemoveResponseDto {
    @ApiProperty({
        example: true,
    })
    @Expose()
    @IsBoolean()
    success: boolean;

    @ApiProperty({
        example: 'notification.success.fcmTokenRemoved',
    })
    @Expose()
    message: string;
}
