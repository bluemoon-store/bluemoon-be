import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FcmTokenUpdateDto {
    @ApiProperty({
        example: faker.string.alphanumeric(152),
        description: 'FCM token from Firebase',
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        example: 'android',
        description: 'Device platform',
    })
    @IsString()
    @IsNotEmpty()
    platform: string;
}
