import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class VerifyEmailQueryDto {
    @ApiProperty({ description: 'Email verification token from the link' })
    @IsUUID()
    @IsNotEmpty()
    public token: string;
}
