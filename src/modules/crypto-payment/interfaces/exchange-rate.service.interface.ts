import { CryptoCurrency } from '@prisma/client';

export interface IExchangeRateService {
    /**
     * Get current exchange rate for a cryptocurrency
     * @param cryptocurrency - Cryptocurrency type
     * @param fiatCurrency - Fiat currency (default: USD)
     * @returns Exchange rate
     */
    getRate(
        cryptocurrency: CryptoCurrency,
        fiatCurrency?: string
    ): Promise<number>;

    /**
     * Convert fiat amount to cryptocurrency
     * @param fiatAmount - Amount in fiat
     * @param cryptocurrency - Cryptocurrency type
     * @param fiatCurrency - Fiat currency (default: USD)
     * @returns Amount in crypto
     */
    convertToCrypto(
        fiatAmount: number,
        cryptocurrency: CryptoCurrency,
        fiatCurrency?: string
    ): Promise<number>;

    /**
     * Convert crypto amount to fiat
     * @param cryptoAmount - Amount in crypto
     * @param cryptocurrency - Cryptocurrency type
     * @param fiatCurrency - Fiat currency (default: USD)
     * @returns Amount in fiat
     */
    convertToFiat(
        cryptoAmount: number,
        cryptocurrency: CryptoCurrency,
        fiatCurrency?: string
    ): Promise<number>;

    /**
     * Get exchange rates for all supported cryptocurrencies
     * @param fiatCurrency - Fiat currency (default: USD)
     * @returns Map of cryptocurrency to rate
     */
    getAllRates(fiatCurrency?: string): Promise<Map<CryptoCurrency, number>>;
}
