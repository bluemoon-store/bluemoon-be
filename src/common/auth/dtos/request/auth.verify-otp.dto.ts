import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Length,
    Matches,
} from 'class-validator';

export class VerifyOtpDto {
    @ApiProperty({ example: 'user@example.com', required: true })
    @IsEmail()
    @IsNotEmpty()
    public email: string;

    @ApiProperty({ example: '123456', required: true })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
    public otp: string;
}
