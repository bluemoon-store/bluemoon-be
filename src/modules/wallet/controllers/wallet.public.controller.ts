import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';

import { WalletTransactionHistoryQueryDto } from '../dtos/request/wallet-transaction-history.request';
import { WalletResponseDto } from '../dtos/response/wallet.response';
import { WalletTransactionResponseDto } from '../dtos/response/wallet-transaction.response';
import { WalletService } from '../services/wallet.service';

@ApiTags('public.wallet')
@Controller({
    path: '/wallet',
    version: '1',
})
export class WalletPublicController {
    constructor(private readonly walletService: WalletService) {}

    @Get('balance')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get wallet balance' })
    @DocResponse({
        serialization: WalletResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'wallet.success.balanceFound',
    })
    public async getBalance(
        @AuthUser() user: IAuthUser
    ): Promise<WalletResponseDto> {
        return this.walletService.getWallet(user.userId);
    }

    @Get('transactions')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get transaction history' })
    @DocPaginatedResponse({
        serialization: WalletTransactionResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'wallet.success.transactionHistory',
    })
    public async getTransactionHistory(
        @AuthUser() user: IAuthUser,
        @Query(QueryTransformPipe) query: WalletTransactionHistoryQueryDto
    ): Promise<ApiPaginatedDataDto<WalletTransactionResponseDto>> {
        return this.walletService.getTransactionHistory(user.userId, {
            page: query.page,
            limit: query.limit,
            type: query.type,
        });
    }
}
