import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorSetupDto {
    @ApiProperty({
        example: faker.string.alphanumeric(6),
        description: 'Current password for verification',
    })
    @IsString()
    @IsNotEmpty()
    public password: string;
}
