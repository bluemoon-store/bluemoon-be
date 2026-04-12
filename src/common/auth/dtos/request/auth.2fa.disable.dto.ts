import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorDisableDto {
    @ApiProperty({
        example: 'your-login-password',
        description: 'Account password',
    })
    @IsString()
    @IsNotEmpty()
    public password: string;

    @ApiProperty({
        example: '123456',
        description: '6-digit TOTP code from authenticator app',
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    public code: string;
}
