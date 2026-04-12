import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com', required: true })
    @IsEmail()
    @IsNotEmpty()
    public email: string;
}
