import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UserBanDto {
    @ApiProperty({
        example: 'Violation of terms of service',
        description: 'Reason for banning the user',
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    public reason?: string;
}
