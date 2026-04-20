import { ApiProperty } from '@nestjs/swagger';
import { CryptoCurrency } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';

export class CreateWalletTopUpDto {
    @ApiProperty({
        enum: CryptoCurrency,
        example: CryptoCurrency.BTC,
    })
    @IsEnum(CryptoCurrency)
    cryptocurrency: CryptoCurrency;

    @ApiProperty({
        type: Number,
        example: 10,
        minimum: 1,
        description: 'Top-up amount in USD',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    amountUsd: number;
}
