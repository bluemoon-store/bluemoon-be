import { ApiProperty } from '@nestjs/swagger';
import { CryptoCurrency, PaymentStatus, Prisma } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class WalletTopUpResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    walletId: string;

    @ApiProperty({ enum: CryptoCurrency })
    @Expose()
    cryptocurrency: CryptoCurrency;

    @ApiProperty({ nullable: true })
    @Expose()
    network: string | null;

    @ApiProperty()
    @Expose()
    paymentAddress: string;

    @ApiProperty({ description: 'Amount in cryptocurrency' })
    @Expose()
    @Type(() => String)
    amount: Prisma.Decimal;

    @ApiProperty({ description: 'Amount in USD' })
    @Expose()
    @Type(() => String)
    amountUsd: Prisma.Decimal;

    @ApiProperty({ nullable: true })
    @Expose()
    @Type(() => String)
    exchangeRate: Prisma.Decimal | null;

    @ApiProperty({ enum: PaymentStatus })
    @Expose()
    status: PaymentStatus;

    @ApiProperty()
    @Expose()
    confirmations: number;

    @ApiProperty()
    @Expose()
    requiredConfirmations: number;

    @ApiProperty()
    @Expose()
    expiresAt: Date;

    @ApiProperty()
    @Expose()
    qrCode: string;

    @ApiProperty()
    @Expose()
    paymentUri: string;

    @ApiProperty({ nullable: true })
    @Expose()
    creditedAt: Date | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;
}
