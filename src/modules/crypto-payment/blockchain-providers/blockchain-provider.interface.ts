export interface Transaction {
    hash: string;
    from: string;
    to: string;
    amount: string;
    confirmations: number;
    blockNumber?: number;
    timestamp?: number;
}

export interface IBlockchainProvider {
    /**
     * Get balance of an address
     * @param address - Wallet address
     * @returns Balance in cryptocurrency
     */
    getBalance(address: string): Promise<string>;

    /**
     * Get transaction by address
     * @param address - Wallet address
     * @returns Transaction details or null
     */
    getTransactionByAddress(address: string): Promise<Transaction | null>;

    /**
     * Get transaction details by hash
     * @param txHash - Transaction hash
     * @returns Transaction details or null
     */
    getTransaction(txHash: string): Promise<Transaction | null>;

    /**
     * Get transaction confirmations
     * @param txHash - Transaction hash
     * @returns Number of confirmations
     */
    getTransactionConfirmations(txHash: string): Promise<number>;

    /**
     * Estimate network fee for a transaction
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount to send
     * @returns Estimated fee in cryptocurrency
     */
    estimateFee(from: string, to: string, amount: string): Promise<string>;

    /**
     * Send transaction
     * @param from - Sender address
     * @param to - Recipient address
     * @param amount - Amount to send
     * @param privateKey - Private key for signing
     * @returns Transaction hash
     */
    sendTransaction(
        from: string,
        to: string,
        amount: string,
        privateKey: string
    ): Promise<string>;

    /**
     * Validate address format
     * @param address - Address to validate
     * @returns True if valid
     */
    isValidAddress(address: string): boolean;

    /**
     * Get network name
     * @returns Network name (mainnet, testnet, etc.)
     */
    getNetworkName(): string;
}
