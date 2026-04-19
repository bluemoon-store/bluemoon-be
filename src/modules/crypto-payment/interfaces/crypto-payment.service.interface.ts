import { CryptoCurrency } from '@prisma/client';
import { CryptoPaymentResponseDto } from '../dtos/response/crypto-payment.response';
import { PaymentStatusResponseDto } from '../dtos/response/payment-status.response';

export interface ICryptoPaymentService {
    createPayment(
        orderId: string,
        cryptocurrency: CryptoCurrency,
        userId: string
    ): Promise<CryptoPaymentResponseDto>;

    getPaymentStatus(
        paymentId: string,
        userId: string
    ): Promise<PaymentStatusResponseDto>;

    getPaymentByOrderId(
        orderId: string,
        userId: string
    ): Promise<CryptoPaymentResponseDto>;

    expirePayment(paymentId: string): Promise<void>;
}
