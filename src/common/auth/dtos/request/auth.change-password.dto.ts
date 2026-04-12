import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'CurrentStr0ng!Pass', required: true })
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
        }
    )
    public currentPassword: string;

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
