import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ReferralCodeVerifyDto {
    @ApiProperty({
        example: faker.string.alphanumeric(8).toUpperCase(),
        description: 'Referral code to verify',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @Length(8, 8, {
        message: 'Referral code must be exactly 8 characters',
    })
    public referralCode: string;
}
