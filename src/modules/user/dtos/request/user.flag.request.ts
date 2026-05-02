import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UserFlagDto {
    @ApiProperty({
        example: 'Suspicious activity',
        description: 'Reason for flagging the user',
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    public reason?: string;
}
