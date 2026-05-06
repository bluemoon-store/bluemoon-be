import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { VouchListQueryDto } from '../dtos/request/vouch.list.query';
import { VouchResponseDto } from '../dtos/response/vouch.response';
import { VouchService } from '../services/vouch.service';

@ApiTags('public.vouch')
@Controller({
    path: '/',
    version: '1',
})
export class VouchPublicController {
    constructor(private readonly vouchService: VouchService) {}

    @Get('/vouches')
    @PublicRoute()
    @ApiOperation({ summary: 'Get public vouches wall' })
    @DocPaginatedResponse({
        serialization: VouchResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'vouch.success.list',
    })
    public async list(
        @Query(new QueryTransformPipe()) query: VouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>> {
        return this.vouchService.list(query);
    }

    @Get('/products/:productId/vouches')
    @PublicRoute()
    @ApiOperation({ summary: 'Get public vouches by product' })
    @DocPaginatedResponse({
        serialization: VouchResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'vouch.success.list',
    })
    public async listByProduct(
        @Param('productId') productId: string,
        @Query(new QueryTransformPipe()) query: VouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>> {
        return this.vouchService.listByProduct(productId, query);
    }
}
