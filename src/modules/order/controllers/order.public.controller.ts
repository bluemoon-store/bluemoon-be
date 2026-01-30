import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { OrderCreateDto } from '../dtos/request/order.create.request';
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
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({
        name: 'status',
        required: false,
        type: String,
        enum: Object.values(OrderStatus),
        description: 'Filter by order status',
    })
    @DocPaginatedResponse({
        serialization: OrderResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'order.success.list',
    })
    public async getOrderHistory(
        @AuthUser() user: IAuthUser,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: OrderStatus
    ) {
        return this.orderService.getOrderHistory(user.userId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status,
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
}
