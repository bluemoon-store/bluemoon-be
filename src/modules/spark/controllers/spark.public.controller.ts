import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { SparkService } from '../services/spark.service';
import { SparkBalanceResponseDto } from '../dtos/response/spark-balance.response';

@ApiTags('public.spark')
@Controller({
    path: '/sparks',
    version: '1',
})
export class SparkPublicController {
    constructor(private readonly sparkService: SparkService) {}

    @Get('balance')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get user spark balance and transaction history' })
    @DocResponse({
        serialization: SparkBalanceResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'spark.success.balance',
    })
    public async getSparkBalance(
        @AuthUser() user: IAuthUser
    ): Promise<SparkBalanceResponseDto> {
        return this.sparkService.getSparkBalance(user.userId);
    }
}
