import { ApiProperty } from '@nestjs/swagger';
import { CryptoCurrency, PaymentStatus } from '@prisma/client';

export class CryptoPaymentResponseDto {
    @ApiProperty({ description: 'Payment ID' })
    paymentId: string;

    @ApiProperty({ description: 'Order ID' })
    orderId: string;

    @ApiProperty({
        description: 'Cryptocurrency',
        enum: CryptoCurrency,
    })
    cryptocurrency: CryptoCurrency;

    @ApiProperty({ description: 'Network (e.g., ERC20, TRC20)' })
    network?: string;

    @ApiProperty({ description: 'Payment address to send crypto to' })
    paymentAddress: string;

    @ApiProperty({ description: 'Amount in cryptocurrency' })
    amount: string;

    @ApiProperty({ description: 'Amount in USD' })
    amountUsd: string;

    @ApiProperty({ description: 'Exchange rate at creation' })
    exchangeRate?: string;

    @ApiProperty({ description: 'QR code data URL (base64)' })
    qrCode: string;

    @ApiProperty({
        description: 'Payment status',
        enum: PaymentStatus,
    })
    status: PaymentStatus;

    @ApiProperty({ description: 'Payment expiration time' })
    expiresAt: Date;

    @ApiProperty({ description: 'Time remaining in seconds' })
    timeRemaining: number;

    @ApiProperty({ description: 'Transaction hash (if paid)' })
    txHash?: string;

    @ApiProperty({ description: 'Number of confirmations' })
    confirmations: number;

    @ApiProperty({ description: 'Required confirmations' })
    requiredConfirmations: number;

    @ApiProperty({ description: 'Payment URI for wallet apps' })
    paymentUri: string;

    @ApiProperty({ description: 'Payment creation time' })
    createdAt: Date;
}
