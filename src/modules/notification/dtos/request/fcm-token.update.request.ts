import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Platform } from '@prisma/client';

export class FcmTokenUpdateDto {
    @ApiProperty({
        example: faker.string.alphanumeric(152),
        description: 'FCM token from Firebase',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        enum: Platform,
        example: Platform.ANDROID,
        description: 'Device platform',
    })
    @IsEnum(Platform)
    @IsNotEmpty()
    platform: Platform;
}
