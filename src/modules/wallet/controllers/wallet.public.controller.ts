import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

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
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('type') type?: string
    ) {
        return this.walletService.getTransactionHistory(user.userId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            type,
        });
    }
}
