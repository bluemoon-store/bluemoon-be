export interface IPaymentForwardingService {
    /**
     * Forward a confirmed payment to platform wallet
     * @param paymentId - Payment ID
     * @returns Forward transaction hash
     */
    forwardPayment(paymentId: string): Promise<string>;

    /**
     * Check if payment should be forwarded
     * @param paymentId - Payment ID
     * @returns True if payment should be forwarded
     */
    shouldForwardPayment(paymentId: string): Promise<boolean>;

    /**
     * Get estimated forwarding fee
     * @param paymentId - Payment ID
     * @returns Estimated fee in cryptocurrency
     */
    estimateForwardingFee(paymentId: string): Promise<string>;
}
