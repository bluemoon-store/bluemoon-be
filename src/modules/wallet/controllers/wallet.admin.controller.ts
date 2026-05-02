import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';

import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';

import { WalletAddBalanceDto } from '../dtos/request/wallet.add-balance.request';
import { WalletTransactionHistoryQueryDto } from '../dtos/request/wallet-transaction-history.request';
import { WalletAdjustBalanceDto } from '../dtos/request/wallet.adjust-balance.request';
import { WalletResponseDto } from '../dtos/response/wallet.response';
import { WalletTransactionResponseDto } from '../dtos/response/wallet-transaction.response';
import { WalletService } from '../services/wallet.service';

@ApiTags('admin.wallet')
@Controller({
    path: '/admin/wallet',
    version: '1',
})
export class WalletAdminController {
    constructor(private readonly walletService: WalletService) {}

    @Get('users/:userId')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'View user wallet' })
    @DocResponse({
        serialization: WalletResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'wallet.success.walletFound',
    })
    public async getUserWallet(
        @Param('userId') userId: string
    ): Promise<WalletResponseDto> {
        return this.walletService.getWalletByUserId(userId);
    }

    @Post('users/:userId/balance')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Add balance to user wallet' })
    @DocResponse({
        serialization: WalletResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'wallet.success.balanceAdded',
    })
    public async addBalance(
        @Param('userId') userId: string,
        @Body() payload: WalletAddBalanceDto
    ): Promise<WalletResponseDto> {
        return this.walletService.addBalance(userId, payload);
    }

    @Put('users/:userId/balance')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Adjust user wallet balance' })
    @DocResponse({
        serialization: WalletResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'wallet.success.balanceAdjusted',
    })
    public async adjustBalance(
        @Param('userId') userId: string,
        @Body() payload: WalletAdjustBalanceDto
    ): Promise<WalletResponseDto> {
        return this.walletService.adjustBalance(userId, payload);
    }

    @Get('users/:userId/transactions')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get user transaction history (admin)' })
    @DocPaginatedResponse({
        serialization: WalletTransactionResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'wallet.success.transactionHistory',
    })
    public async getUserTransactionHistory(
        @Param('userId') userId: string,
        @Query(new QueryTransformPipe()) query: WalletTransactionHistoryQueryDto
    ): Promise<ApiPaginatedDataDto<WalletTransactionResponseDto>> {
        return this.walletService.getTransactionHistory(userId, {
            page: query.page,
            limit: query.limit,
            type: query.type,
        });
    }
}
