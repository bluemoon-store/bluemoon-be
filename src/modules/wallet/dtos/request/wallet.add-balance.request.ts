import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import {
    IsNumber,
    Min,
    IsString,
    IsOptional,
    MaxLength,
} from 'class-validator';

export class WalletAddBalanceDto {
    @ApiProperty({
        example: 100.0,
        description: 'Amount to add to wallet balance',
        minimum: 0.01,
    })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({
        example: 'Deposit via admin',
        description: 'Description of the transaction',
    })
    @IsString()
    @MaxLength(500)
    description: string;

    @ApiPropertyOptional({
        example: faker.string.uuid(),
        description: 'Optional reference ID (e.g., order ID, payment ID)',
    })
    @IsOptional()
    @IsString()
    referenceId?: string;
}
