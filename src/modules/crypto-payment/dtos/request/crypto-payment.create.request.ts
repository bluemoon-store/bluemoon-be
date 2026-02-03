import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { CryptoCurrency } from '@prisma/client';

export class CreateCryptoPaymentDto {
    @ApiProperty({
        description: 'Cryptocurrency to use for payment',
        enum: CryptoCurrency,
        example: CryptoCurrency.BTC,
    })
    @IsEnum(CryptoCurrency)
    @IsNotEmpty()
    cryptocurrency: CryptoCurrency;
}
