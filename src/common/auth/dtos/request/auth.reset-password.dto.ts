import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Length,
    Matches,
} from 'class-validator';

export class ResetPasswordDto {
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

    @ApiProperty({ example: 'NewStr0ng!Pass', required: true })
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
        }
    )
    public newPassword: string;
}
