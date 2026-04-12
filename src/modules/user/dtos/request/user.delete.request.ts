import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
    @ApiProperty({ example: 'your-login-password', required: true })
    @IsString()
    @IsNotEmpty()
    public password: string;
}
