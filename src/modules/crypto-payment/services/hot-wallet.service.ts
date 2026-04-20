import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ethers } from 'ethers';

import { EthereumProvider } from '../blockchain-providers/ethereum-provider.service';
import {
    MIN_TRX_SUN_FOR_TRC20_FORWARD,
    TronProvider,
} from '../blockchain-providers/tron-provider.service';

@Injectable()
export class HotWalletService {
    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger,
        private readonly ethProvider: EthereumProvider,
        private readonly tronProvider: TronProvider
    ) {
        this.logger.setContext(HotWalletService.name);
    }

    /**
     * Calculate ETH top-up amount for an ERC-20 forward.
     * Uses live gas estimation × current maxFeePerGas + configurable % buffer.
     */
    async calcEthTopUp(
        paymentAddress: string,
        platformAddress: string,
        tokenAmount: string,
        tokenContract: string
    ): Promise<string> {
        const bufferPct = BigInt(
            this.configService.get<number>('crypto.hotWallet.eth.gasBuffer', 25)
        );
        const gasEstimate = await this.ethProvider.estimateERC20TransferGas(
            paymentAddress,
            platformAddress,
            tokenAmount,
            tokenContract
        );
        const maxFee = await this.ethProvider.getCurrentMaxFeePerGas();
        const gasWithBuffer = (gasEstimate * (100n + bufferPct)) / 100n;
        const weiNeeded = gasWithBuffer * maxFee;
        return ethers.formatEther(weiNeeded);
    }

    /** True if payment address ETH balance is below the needed top-up amount. */
    async needsEthTopUp(
        paymentAddress: string,
        platformAddress: string,
        tokenAmount: string,
        tokenContract: string
    ): Promise<boolean> {
        const required = await this.calcEthTopUp(
            paymentAddress,
            platformAddress,
            tokenAmount,
            tokenContract
        );
        const balance = await this.ethProvider.getBalance(paymentAddress);
        return parseFloat(balance) < parseFloat(required);
    }

    async topUpEthGas(
        paymentAddress: string,
        platformAddress: string,
        tokenAmount: string,
        tokenContract: string
    ): Promise<string> {
        const privateKey = this.configService.get<string>(
            'crypto.hotWallet.eth.privateKey'
        );
        const fromAddress = this.configService.get<string>(
            'crypto.hotWallet.eth.address'
        );
        if (!privateKey || !fromAddress) {
            throw new Error('HOT_WALLET_ETH config missing');
        }
        const amount = await this.calcEthTopUp(
            paymentAddress,
            platformAddress,
            tokenAmount,
            tokenContract
        );
        this.logger.info({ paymentAddress, amount }, 'Sending ETH gas top-up');
        return this.ethProvider.sendTransaction(
            fromAddress,
            paymentAddress,
            amount,
            privateKey
        );
    }

    /** True if TRX balance on payment address is below the 15 TRX forwarding minimum. */
    async needsTrxTopUp(paymentAddress: string): Promise<boolean> {
        const trxSun = await this.tronProvider.getTrxBalanceSun(paymentAddress);
        return trxSun < MIN_TRX_SUN_FOR_TRC20_FORWARD;
    }

    async topUpTrxEnergy(paymentAddress: string): Promise<string> {
        const privateKey = this.configService.get<string>(
            'crypto.hotWallet.trx.privateKey'
        );
        const amount = this.configService.get<string>(
            'crypto.hotWallet.trx.trxTopUpAmount',
            '20'
        );
        if (!privateKey) {
            throw new Error('HOT_WALLET_TRX_PRIVATE_KEY config missing');
        }
        this.logger.info(
            { paymentAddress, amount },
            'Sending TRX energy top-up'
        );
        return this.tronProvider.sendNativeTrx(
            paymentAddress,
            amount,
            privateKey
        );
    }
}
