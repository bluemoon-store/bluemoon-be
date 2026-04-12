import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class TwoFactorVerifyLoginDto {
    @ApiProperty({
        description: 'JWT from login step when requiresTwoFactor is true',
    })
    @IsString()
    @IsNotEmpty()
    public twoFactorToken: string;

    @ApiProperty({
        example: '123456',
        description: '6-digit TOTP from authenticator app',
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    @Matches(/^\d{6}$/)
    public code: string;
}
