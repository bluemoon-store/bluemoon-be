import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FcmTokenRemoveDto {
    @ApiProperty({
        example: faker.string.alphanumeric(152),
        description: 'FCM token to remove',
    })
    @IsString()
    @IsNotEmpty()
    token: string;
}
