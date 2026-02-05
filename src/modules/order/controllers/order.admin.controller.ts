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
import { Role } from '@prisma/client';

import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { OrderStatusUpdateDto } from '../dtos/request/order.status-update.request';
import { OrderListQueryDto } from '../dtos/request/order-list.request';
import { OrderDeliverDto } from '../dtos/request/order.deliver.request';
import {
    OrderResponseDto,
    OrderDetailResponseDto,
} from '../dtos/response/order.response';
import { OrderService } from '../services/order.service';
import { OrderDeliveryService } from '../services/order-delivery.service';

@ApiTags('admin.order')
@Controller({
    path: '/admin/orders',
    version: '1',
})
export class OrderAdminController {
    constructor(
        private readonly orderService: OrderService,
        private readonly deliveryService: OrderDeliveryService
    ) {}

    @Get()
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List all orders (admin)' })
    @DocPaginatedResponse({
        serialization: OrderDetailResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.list',
    })
    public async getAllOrders(
        @Query(new QueryTransformPipe()) query: OrderListQueryDto
    ): Promise<ApiPaginatedDataDto<OrderDetailResponseDto>> {
        return this.orderService.getAllOrders({
            page: query.page,
            limit: query.limit,
            status: query.status,
            userId: query.userId,
        });
    }

    @Get(':id')
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get order detail (admin)' })
    @DocResponse({
        serialization: OrderDetailResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.orderFound',
    })
    public async getOrderDetail(
        @Param('id') orderId: string
    ): Promise<OrderDetailResponseDto> {
        return this.orderService.getOrderDetail(orderId);
    }

    @Put(':id/status')
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update order status' })
    @DocResponse({
        serialization: OrderResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.statusUpdated',
    })
    public async updateOrderStatus(
        @Param('id') orderId: string,
        @Body() payload: OrderStatusUpdateDto
    ): Promise<OrderResponseDto> {
        return this.orderService.updateOrderStatus(orderId, payload);
    }

    @Post(':id/deliver')
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Manually deliver order' })
    @DocResponse({
        serialization: OrderResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.delivered',
    })
    public async deliverOrder(
        @Param('id') orderId: string,
        @Body() payload: OrderDeliverDto
    ): Promise<OrderResponseDto> {
        return this.deliveryService.deliverOrder(orderId, payload);
    }

    @Post(':id/refund')
    @AllowedRoles([Role.ADMIN])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Refund order' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.refunded',
    })
    public async refundOrder(
        @Param('id') orderId: string
    ): Promise<ApiGenericResponseDto> {
        return this.orderService.refundOrder(orderId);
    }
}
