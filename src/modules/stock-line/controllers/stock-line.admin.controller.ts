import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogCategory } from '@prisma/client';

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { AuditLog } from 'src/modules/activity-log/decorators/audit-log.decorator';

import { StockLineBulkAddRequestDto } from '../dtos/request/stock-line.bulk-add.request';
import { StockLineListQueryDto } from '../dtos/request/stock-line.list.query';
import {
    StockLineAdminRowDto,
    StockLineBulkAddResponseDto,
} from '../dtos/response/stock-line.admin.response';
import { StockLineSummaryResponseDto } from '../dtos/response/stock-line.summary.response';
import { StockLineService } from '../services/stock-line.service';

@ApiTags('admin.product.stock')
@Controller({
    path: 'admin/products',
    version: '1',
})
export class StockLineAdminController {
    constructor(private readonly stockLineService: StockLineService) {}

    @Post(':id/variants/:variantId/stock/lines')
    @AuditLog({
        action: 'product.stock.lines.bulkAdd',
        category: ActivityLogCategory.PRODUCT,
        resourceType: 'ProductVariant',
        resourceIdParam: 'variantId',
    })
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Bulk add stock lines for a variant' })
    @DocResponse({
        serialization: StockLineBulkAddResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.stockLinesAdded',
    })
    public async bulkAddLines(
        @Param('id') productId: string,
        @Param('variantId') variantId: string,
        @Body() body: StockLineBulkAddRequestDto
    ): Promise<StockLineBulkAddResponseDto> {
        return this.stockLineService.bulkAddLines(
            productId,
            variantId,
            body.lines ?? []
        );
    }

    @Get(':id/variants/:variantId/stock/lines')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List stock lines for a variant' })
    @DocPaginatedResponse({
        serialization: StockLineAdminRowDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.stockLinesListed',
    })
    public async listLines(
        @Param('id') productId: string,
        @Param('variantId') variantId: string,
        @Query(new QueryTransformPipe()) query: StockLineListQueryDto
    ): Promise<ApiPaginatedDataDto<StockLineAdminRowDto>> {
        return this.stockLineService.listLines(productId, variantId, query);
    }

    @Get(':id/variants/:variantId/stock/summary')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Stock line counts for a variant' })
    @DocResponse({
        serialization: StockLineSummaryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.stockSummary',
    })
    public async getSummary(
        @Param('id') productId: string,
        @Param('variantId') variantId: string
    ): Promise<StockLineSummaryResponseDto> {
        return this.stockLineService.getSummary(productId, variantId);
    }

    @Delete(':id/variants/:variantId/stock/lines/:lineId')
    @AuditLog({
        action: 'product.stock.lines.deleteOne',
        category: ActivityLogCategory.PRODUCT,
        resourceType: 'ProductStockLine',
        resourceIdParam: 'lineId',
    })
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete one AVAILABLE stock line' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.stockLineDeleted',
    })
    public async deleteLine(
        @Param('id') productId: string,
        @Param('variantId') variantId: string,
        @Param('lineId') lineId: string
    ): Promise<{ success: true }> {
        await this.stockLineService.deleteAvailableLine(
            productId,
            variantId,
            lineId
        );
        return { success: true };
    }

    @Delete(':id/variants/:variantId/stock/lines')
    @AuditLog({
        action: 'product.stock.lines.clearAvailable',
        category: ActivityLogCategory.PRODUCT,
        resourceType: 'ProductVariant',
        resourceIdParam: 'variantId',
    })
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Clear all AVAILABLE stock lines for a variant' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.stockCleared',
    })
    public async clearOrReject(
        @Param('id') productId: string,
        @Param('variantId') variantId: string,
        @Query('status') status?: string
    ): Promise<{ success: true }> {
        if (status !== 'AVAILABLE') {
            throw new BadRequestException(
                'stockLine.error.clearRequiresStatusAvailable'
            );
        }
        await this.stockLineService.clearAvailable(productId, variantId);
        return { success: true };
    }
}
