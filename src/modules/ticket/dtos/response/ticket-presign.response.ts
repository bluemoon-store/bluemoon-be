import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class TicketPresignResponseDto {
    @ApiProperty()
    @Expose()
    @IsString()
    url: string;

    @ApiProperty({ example: 3600 })
    @Expose()
    @IsInt()
    expiresIn: number;
}
