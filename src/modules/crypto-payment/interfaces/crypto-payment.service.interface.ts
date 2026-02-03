import { CryptoCurrency } from '@prisma/client';
import { CryptoPaymentResponseDto } from '../dtos/response/crypto-payment.response';
import { PaymentStatusResponseDto } from '../dtos/response/payment-status.response';

export interface ICryptoPaymentService {
    /**
     * Create a crypto payment for an order
     * @param orderId - Order ID
     * @param cryptocurrency - Selected cryptocurrency
     * @param userId - User ID
     * @returns Payment details with address and QR code
     */
    createPayment(
        orderId: string,
        cryptocurrency: CryptoCurrency,
        userId: string
    ): Promise<CryptoPaymentResponseDto>;

    /**
     * Get payment status
     * @param paymentId - Payment ID
     * @param userId - User ID
     * @returns Current payment status
     */
    getPaymentStatus(
        paymentId: string,
        userId: string
    ): Promise<PaymentStatusResponseDto>;

    /**
     * Get payment by order ID
     * @param orderId - Order ID
     * @param userId - User ID
     * @returns Payment details
     */
    getPaymentByOrderId(
        orderId: string,
        userId: string
    ): Promise<CryptoPaymentResponseDto>;

    /**
     * Handle payment expiration
     * @param paymentId - Payment ID
     */
    expirePayment(paymentId: string): Promise<void>;
}
