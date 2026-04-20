import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { OrderStatus } from '@prisma/client';

import {
    OrderResponseDto,
    OrderDetailResponseDto,
} from '../dtos/response/order.response';
import { OrderCreateDto } from '../dtos/request/order.create.request';
import { OrderStatusUpdateDto } from '../dtos/request/order.status-update.request';

export interface IOrderService {
    createOrder(
        userId: string,
        data: OrderCreateDto
    ): Promise<OrderResponseDto>;
    getOrderHistory(
        userId: string,
        options?: {
            page?: number;
            limit?: number;
            status?: OrderStatus;
        }
    ): Promise<ApiPaginatedDataDto<OrderResponseDto>>;
    getOrderDetail(
        orderId: string,
        userId?: string,
        skipOwnershipCheck?: boolean
    ): Promise<OrderDetailResponseDto>;
    updateOrderStatus(
        orderId: string,
        data: OrderStatusUpdateDto
    ): Promise<OrderResponseDto>;
    payOrderWithWallet(
        orderId: string,
        userId: string
    ): Promise<OrderResponseDto>;
    cancelOrder(orderId: string, userId: string): Promise<OrderResponseDto>;
    getAllOrders(options?: {
        page?: number;
        limit?: number;
        status?: OrderStatus;
        userId?: string;
    }): Promise<ApiPaginatedDataDto<OrderDetailResponseDto>>;
    refundOrder(orderId: string): Promise<ApiGenericResponseDto>;
    generateOrderNumber(): Promise<string>;
}
