import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorVerifyDto {
    @ApiProperty({
        example: faker.string.numeric(6),
        description: '6-digit TOTP code from authenticator app',
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    public code: string;
}
