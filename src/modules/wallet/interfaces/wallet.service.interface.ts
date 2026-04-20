import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { WalletResponseDto } from '../dtos/response/wallet.response';
import { WalletTransactionResponseDto } from '../dtos/response/wallet-transaction.response';
import { WalletAddBalanceDto } from '../dtos/request/wallet.add-balance.request';
import { WalletAdjustBalanceDto } from '../dtos/request/wallet.adjust-balance.request';
import { CreateWalletTopUpDto } from '../dtos/request/wallet.topup.request';
import { WalletTopUpResponseDto } from '../dtos/response/wallet-topup.response';

export interface IWalletService {
    createWallet(userId: string): Promise<WalletResponseDto>;
    getWallet(userId: string): Promise<WalletResponseDto>;
    getWalletByUserId(userId: string): Promise<WalletResponseDto>;
    addBalance(
        userId: string,
        data: WalletAddBalanceDto
    ): Promise<WalletResponseDto>;
    deductBalance(
        userId: string,
        amount: number,
        description: string,
        referenceId?: string
    ): Promise<WalletResponseDto>;
    adjustBalance(
        userId: string,
        data: WalletAdjustBalanceDto
    ): Promise<WalletResponseDto>;
    refundBalance(
        userId: string,
        amount: number,
        description: string,
        referenceId?: string
    ): Promise<WalletResponseDto>;
    getTransactionHistory(
        userId: string,
        options?: {
            page?: number;
            limit?: number;
            type?: string;
        }
    ): Promise<ApiPaginatedDataDto<WalletTransactionResponseDto>>;
    createTopUp(
        userId: string,
        dto: CreateWalletTopUpDto
    ): Promise<WalletTopUpResponseDto>;
    getTopUp(userId: string, topUpId: string): Promise<WalletTopUpResponseDto>;
    getTopUpStatus(
        userId: string,
        topUpId: string
    ): Promise<WalletTopUpResponseDto>;
    processConfirmedTopUp(topUpId: string): Promise<void>;
    expireWalletTopUp(topUpId: string): Promise<void>;
}
