import QRCode from 'qrcode';
import { CryptoCurrency } from '@prisma/client';

/**
 * Generate payment URI for cryptocurrency wallets
 * @param address - Payment address
 * @param amount - Amount in cryptocurrency
 * @param cryptocurrency - Cryptocurrency type
 * @returns Payment URI string
 */
export function generatePaymentURI(
    address: string,
    amount: number,
    cryptocurrency: CryptoCurrency
): string {
    switch (cryptocurrency) {
        case CryptoCurrency.BTC:
            // Bitcoin: bitcoin:address?amount=0.001
            return `bitcoin:${address}?amount=${amount}`;

        case CryptoCurrency.LTC:
            // Litecoin: litecoin:address?amount=0.001
            return `litecoin:${address}?amount=${amount}`;

        case CryptoCurrency.BCH:
            // Bitcoin Cash: bitcoin:address?amount=0.001 (some wallets use bitcoin: prefix)
            return `bitcoincash:${address}?amount=${amount}`;

        case CryptoCurrency.ETH:
            // Ethereum: ethereum:address?value=1000000000000000000 (value in Wei)
            const ethWei = (amount * 1e18).toString();
            return `ethereum:${address}?value=${ethWei}`;

        case CryptoCurrency.USDT_ERC20:
            // USDT ERC-20: ethereum:address?value=1000000 (USDT has 6 decimals)
            const usdtAmount = (amount * 1e6).toString();
            return `ethereum:${address}?value=${usdtAmount}`;

        case CryptoCurrency.USDT_TRC20:
            // USDT TRC-20: tron:address?amount=1000000 (USDT has 6 decimals)
            const trc20Amount = (amount * 1e6).toString();
            return `tron:${address}?amount=${trc20Amount}`;

        case CryptoCurrency.USDC_ERC20:
            // USDC ERC-20: ethereum:address?value=1000000 (USDC has 6 decimals)
            const usdcAmount = (amount * 1e6).toString();
            return `ethereum:${address}?value=${usdcAmount}`;

        default:
            // Fallback: just return the address
            return address;
    }
}

/**
 * Generate QR code as base64 data URL
 * @param address - Payment address
 * @param amount - Amount in cryptocurrency
 * @param cryptocurrency - Cryptocurrency type
 * @returns Base64 data URL of QR code image
 */
export async function generatePaymentQRCode(
    address: string,
    amount: number,
    cryptocurrency: CryptoCurrency
): Promise<string> {
    const paymentURI = generatePaymentURI(address, amount, cryptocurrency);

    try {
        // Generate QR code as data URL (base64 PNG)
        const qrCodeDataURL = await QRCode.toDataURL(paymentURI, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M', // Medium error correction
        });

        return qrCodeDataURL;
    } catch (error) {
        throw new Error(
            `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Generate QR code as buffer (for file storage if needed)
 * @param address - Payment address
 * @param amount - Amount in cryptocurrency
 * @param cryptocurrency - Cryptocurrency type
 * @returns Buffer containing QR code PNG data
 */
export async function generatePaymentQRCodeBuffer(
    address: string,
    amount: number,
    cryptocurrency: CryptoCurrency
): Promise<Buffer> {
    const paymentURI = generatePaymentURI(address, amount, cryptocurrency);

    try {
        const qrCodeBuffer = await QRCode.toBuffer(paymentURI, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        });

        return qrCodeBuffer;
    } catch (error) {
        throw new Error(
            `Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}
