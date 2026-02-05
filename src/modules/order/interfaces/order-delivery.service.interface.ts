import { OrderResponseDto } from '../dtos/response/order.response';
import { OrderDeliverDto } from '../dtos/request/order.deliver.request';
import { OrderDeliveryResponseDto } from '../dtos/response/order-delivery.response';

export interface IOrderDeliveryService {
    deliverOrder(
        orderId: string,
        data: OrderDeliverDto
    ): Promise<OrderResponseDto>;
    processInstantDelivery(orderId: string): Promise<OrderResponseDto>;
    getDeliveryContent(
        orderId: string,
        userId: string
    ): Promise<OrderDeliveryResponseDto>;
}
