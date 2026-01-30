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
import { Role, OrderStatus } from '@prisma/client';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { OrderStatusUpdateDto } from '../dtos/request/order.status-update.request';
import { OrderDeliverDto } from '../dtos/request/order.deliver.request';
import {
    OrderResponseDto,
    OrderDetailResponseDto,
} from '../dtos/response/order.response';
import { OrderService } from '../services/order.service';
import { OrderDeliveryService } from '../services/order-delivery.service';
import { WalletService } from 'src/modules/wallet/services/wallet.service';

@ApiTags('admin.order')
@Controller({
    path: '/admin/orders',
    version: '1',
})
export class OrderAdminController {
    constructor(
        private readonly orderService: OrderService,
        private readonly deliveryService: OrderDeliveryService,
        private readonly walletService: WalletService
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
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('status') status?: OrderStatus,
        @Query('userId') userId?: string
    ) {
        return this.orderService.getAllOrders({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status,
            userId,
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
        const updatedOrder = await this.orderService.updateOrderStatus(
            orderId,
            payload
        );

        // Process instant delivery if status changed to PAYMENT_RECEIVED or PROCESSING
        if (
            payload.status === OrderStatus.PAYMENT_RECEIVED ||
            payload.status === OrderStatus.PROCESSING
        ) {
            try {
                await this.deliveryService.processInstantDelivery(orderId);
            } catch (error) {
                // Log error but don't fail the status update
                this.deliveryService['logger'].warn(
                    `Failed to process instant delivery for order ${orderId}: ${error.message}`
                );
            }
        }

        return updatedOrder;
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
        try {
            const order = await this.orderService.getOrderDetail(orderId);

            // Only allow refund for COMPLETED or CANCELLED orders
            if (
                order.status !== OrderStatus.COMPLETED &&
                order.status !== OrderStatus.CANCELLED
            ) {
                throw new HttpException(
                    'order.error.cannotRefundOrder',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Update order status to REFUNDED
            await this.orderService.updateOrderStatus(orderId, {
                status: OrderStatus.REFUNDED,
            });

            // Refund amount to user wallet
            const totalAmount =
                typeof order.totalAmount === 'string'
                    ? parseFloat(order.totalAmount)
                    : Number(order.totalAmount);

            await this.walletService.refundBalance(
                order.userId,
                totalAmount,
                `Refund for order ${order.orderNumber}`,
                order.id
            );

            return {
                statusCode: HttpStatus.OK,
                message: 'order.success.refunded',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'order.error.refundFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
