export interface IBlockchainMonitorService {
    /**
     * Check a single payment for incoming transaction
     * @param paymentId - Payment ID
     */
    checkPayment(paymentId: string): Promise<void>;

    /**
     * Check all pending payments
     */
    checkPendingPayments(): Promise<void>;

    /**
     * Check transaction confirmations
     * @param paymentId - Payment ID
     */
    checkConfirmations(paymentId: string): Promise<void>;

    /**
     * Confirm payment after required confirmations
     * @param paymentId - Payment ID
     */
    confirmPayment(paymentId: string): Promise<void>;
}
