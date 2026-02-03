import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class PaymentStatusResponseDto {
    @ApiProperty({ description: 'Payment ID' })
    paymentId: string;

    @ApiProperty({
        description: 'Payment status',
        enum: PaymentStatus,
    })
    status: PaymentStatus;

    @ApiProperty({ description: 'Payment address' })
    paymentAddress: string;

    @ApiProperty({ description: 'Expected amount' })
    amount: string;

    @ApiProperty({ description: 'Transaction hash (if detected)' })
    txHash?: string;

    @ApiProperty({ description: 'Number of confirmations' })
    confirmations: number;

    @ApiProperty({ description: 'Required confirmations' })
    requiredConfirmations: number;

    @ApiProperty({ description: 'Time remaining in seconds (0 if expired)' })
    timeRemaining: number;

    @ApiProperty({ description: 'Whether payment has expired' })
    isExpired: boolean;

    @ApiProperty({ description: 'When payment was detected' })
    paidAt?: Date;

    @ApiProperty({ description: 'When payment was confirmed' })
    confirmedAt?: Date;

    @ApiProperty({ description: 'Payment expiration time' })
    expiresAt: Date;
}
