import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';

import { OrderCreateDto } from '../dtos/request/order.create.request';
import { OrderHistoryQueryDto } from '../dtos/request/order-history.request';
import {
    OrderResponseDto,
    OrderDetailResponseDto,
} from '../dtos/response/order.response';
import { OrderDeliveryResponseDto } from '../dtos/response/order-delivery.response';
import { OrderService } from '../services/order.service';
import { OrderDeliveryService } from '../services/order-delivery.service';

@ApiTags('public.order')
@Controller({
    path: '/orders',
    version: '1',
})
export class OrderPublicController {
    constructor(
        private readonly orderService: OrderService,
        private readonly deliveryService: OrderDeliveryService
    ) {}

    @Post()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create order from cart' })
    @DocResponse({
        serialization: OrderResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'order.success.created',
    })
    public async createOrder(
        @AuthUser() user: IAuthUser,
        @Body() payload: OrderCreateDto
    ): Promise<OrderResponseDto> {
        return this.orderService.createOrder(user.userId, payload);
    }

    @Get()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List user orders' })
    @DocPaginatedResponse({
        serialization: OrderResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.list',
    })
    public async getOrderHistory(
        @AuthUser() user: IAuthUser,
        @Query(new QueryTransformPipe()) query: OrderHistoryQueryDto
    ): Promise<ApiPaginatedDataDto<OrderResponseDto>> {
        return this.orderService.getOrderHistory(user.userId, {
            page: query.page,
            limit: query.limit,
            status: query.status,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            cryptocurrency: query.cryptocurrency,
        });
    }

    @Get(':id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get order detail' })
    @DocResponse({
        serialization: OrderDetailResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.orderFound',
    })
    public async getOrderDetail(
        @AuthUser() user: IAuthUser,
        @Param('id') orderId: string
    ): Promise<OrderDetailResponseDto> {
        return this.orderService.getOrderDetail(orderId, user.userId);
    }

    @Get(':id/delivery')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get delivered content for order' })
    @DocResponse({
        serialization: OrderDeliveryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.deliveryContent',
    })
    public async getDeliveryContent(
        @AuthUser() user: IAuthUser,
        @Param('id') orderId: string
    ): Promise<OrderDeliveryResponseDto> {
        return this.deliveryService.getDeliveryContent(orderId, user.userId);
    }

    @Post(':id/wallet-payment')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Pay order with wallet balance' })
    @DocResponse({
        serialization: OrderResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.walletPaymentSuccess',
    })
    public async payWithWallet(
        @AuthUser() user: IAuthUser,
        @Param('id') orderId: string
    ): Promise<OrderResponseDto> {
        return this.orderService.payOrderWithWallet(orderId, user.userId);
    }
}
