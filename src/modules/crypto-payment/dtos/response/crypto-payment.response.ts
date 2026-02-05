import { ApiProperty } from '@nestjs/swagger';
import { CryptoCurrency, PaymentStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class CryptoPaymentResponseDto {
    @ApiProperty({ description: 'Payment ID' })
    @Expose()
    paymentId: string;

    @ApiProperty({ description: 'Order ID' })
    @Expose()
    orderId: string;

    @ApiProperty({
        description: 'Cryptocurrency',
        enum: CryptoCurrency,
    })
    @Expose()
    cryptocurrency: CryptoCurrency;

    @ApiProperty({ description: 'Network (e.g., ERC20, TRC20)' })
    network?: string;

    @ApiProperty({ description: 'Payment address to send crypto to' })
    @Expose()
    paymentAddress: string;

    @ApiProperty({ description: 'Amount in cryptocurrency' })
    @Expose()
    amount: string;

    @ApiProperty({ description: 'Amount in USD' })
    @Expose()
    amountUsd: string;

    @ApiProperty({ description: 'Exchange rate at creation' })
    exchangeRate?: string;

    @ApiProperty({ description: 'QR code data URL (base64)' })
    @Expose()
    qrCode: string;

    @ApiProperty({
        description: 'Payment status',
        enum: PaymentStatus,
    })
    @Expose()
    status: PaymentStatus;

    @ApiProperty({ description: 'Payment expiration time' })
    @Expose()
    expiresAt: Date;

    @ApiProperty({ description: 'Time remaining in seconds' })
    @Expose()
    timeRemaining: number;

    @ApiProperty({ description: 'Transaction hash (if paid)' })
    txHash?: string;

    @ApiProperty({ description: 'Number of confirmations' })
    @Expose()
    confirmations: number;

    @ApiProperty({ description: 'Required confirmations' })
    @Expose()
    requiredConfirmations: number;

    @ApiProperty({ description: 'Payment URI for wallet apps' })
    @Expose()
    paymentUri: string;

    @ApiProperty({ description: 'Payment creation time' })
    @Expose()
    createdAt: Date;
}
