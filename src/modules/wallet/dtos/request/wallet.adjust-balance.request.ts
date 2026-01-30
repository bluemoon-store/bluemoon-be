import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class WalletAdjustBalanceDto {
    @ApiProperty({
        example: 50.0,
        description:
            'New balance amount (can be positive or negative adjustment)',
    })
    @IsNumber()
    amount: number;

    @ApiProperty({
        example: 'Admin balance adjustment',
        description: 'Description of the adjustment',
    })
    @IsString()
    @MaxLength(500)
    description: string;

    @ApiPropertyOptional({
        example: faker.string.uuid(),
        description: 'Optional reference ID',
    })
    @IsOptional()
    @IsString()
    referenceId?: string;
}
