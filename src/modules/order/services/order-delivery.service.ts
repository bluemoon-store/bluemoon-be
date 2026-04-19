import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { OrderStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';

import { OrderDeliverDto } from '../dtos/request/order.deliver.request';
import { OrderResponseDto } from '../dtos/response/order.response';
import { OrderDeliveryResponseDto } from '../dtos/response/order-delivery.response';
import { IOrderDeliveryService } from '../interfaces/order-delivery.service.interface';

@Injectable()
export class OrderDeliveryService implements IOrderDeliveryService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(OrderDeliveryService.name);
    }

    /**
     * Process instant delivery for order items
     */
    async processInstantDelivery(orderId: string): Promise<OrderResponseDto> {
        try {
            const order = await this.databaseService.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            if (!order) {
                throw new HttpException(
                    'order.error.orderNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Only process if order is COMPLETED
            if (order.status !== OrderStatus.COMPLETED) {
                throw new HttpException(
                    'order.error.invalidOrderStatusForDelivery',
                    HttpStatus.BAD_REQUEST
                );
            }

            const deliveryItems = [];
            const now = new Date();

            // Process each item
            for (const item of order.items) {
                // With DeliveryType always INSTANT, simply deliver any undelivered items
                if (!item.deliveredContent) {
                    // Use product's delivery content
                    const content =
                        item.product.deliveryContent ||
                        'Your product has been delivered.';

                    await this.databaseService.orderItem.update({
                        where: { id: item.id },
                        data: {
                            deliveredContent: content,
                            deliveredAt: now,
                        },
                    });

                    deliveryItems.push({
                        itemId: item.id,
                        productName: item.product.name,
                        content,
                    });
                }
            }

            // All items should be delivered when order is COMPLETED
            // Status remains COMPLETED

            this.logger.info(
                {
                    orderId,
                    deliveredItems: deliveryItems.length,
                },
                'Instant delivery processed'
            );

            // Fetch updated order
            return this.databaseService.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                    images: {
                                        where: { deletedAt: null },
                                        orderBy: [
                                            { isPrimary: 'desc' },
                                            { sortOrder: 'asc' },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            }) as unknown as Promise<OrderResponseDto>;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to process instant delivery: ${error.message}`
            );
            throw new HttpException(
                'order.error.processInstantDeliveryFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Deliver order manually (admin)
     */
    async deliverOrder(
        orderId: string,
        data: OrderDeliverDto
    ): Promise<OrderResponseDto> {
        try {
            const order = await this.databaseService.order.findUnique({
                where: { id: orderId },
                include: {
                    items: true,
                },
            });

            if (!order) {
                throw new HttpException(
                    'order.error.orderNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Only allow delivery if order is COMPLETED
            if (order.status !== OrderStatus.COMPLETED) {
                throw new HttpException(
                    'order.error.invalidOrderStatusForDelivery',
                    HttpStatus.BAD_REQUEST
                );
            }

            const now = new Date();

            // Update each order item with delivery content
            for (const deliveryItem of data.items) {
                const orderItem = order.items.find(
                    item => item.id === deliveryItem.itemId
                );

                if (!orderItem) {
                    throw new HttpException(
                        `order.error.orderItemNotFound: ${deliveryItem.itemId}`,
                        HttpStatus.NOT_FOUND
                    );
                }

                await this.databaseService.orderItem.update({
                    where: { id: deliveryItem.itemId },
                    data: {
                        deliveredContent: deliveryItem.content,
                        deliveredAt: now,
                    },
                });
            }

            // Check if all items are now delivered
            const updatedOrder = await this.databaseService.order.findUnique({
                where: { id: orderId },
                include: {
                    items: true,
                },
            });

            const allDelivered = updatedOrder.items.every(
                item => item.deliveredAt !== null
            );

            // Update order status - all items should be delivered when COMPLETED
            const updateData: any = {};
            if (allDelivered) {
                updateData.completedAt = now;
            }

            const finalOrder = await this.databaseService.order.update({
                where: { id: orderId },
                data: updateData,
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                    images: {
                                        where: { deletedAt: null },
                                        orderBy: [
                                            { isPrimary: 'desc' },
                                            { sortOrder: 'asc' },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            });

            this.logger.info(
                {
                    orderId,
                    deliveredItems: data.items.length,
                    allDelivered,
                },
                'Order delivered manually'
            );

            // TODO: Send delivery notification email/push notification
            // this.notificationService.sendDeliveryNotification(order.userId, orderId);

            return finalOrder as unknown as OrderResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to deliver order: ${error.message}`);
            throw new HttpException(
                'order.error.deliverOrderFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get delivery content for order (user-facing)
     */
    async getDeliveryContent(
        orderId: string,
        userId: string
    ): Promise<OrderDeliveryResponseDto> {
        try {
            const order = await this.databaseService.order.findFirst({
                where: {
                    id: orderId,
                    userId,
                    deletedAt: null,
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });

            if (!order) {
                throw new HttpException(
                    'order.error.orderNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Only return content if order is COMPLETED
            if (order.status !== OrderStatus.COMPLETED) {
                throw new HttpException(
                    'order.error.orderNotDelivered',
                    HttpStatus.BAD_REQUEST
                );
            }

            const deliveryItems = await Promise.all(
                order.items
                    .filter(item => item.deliveredContent)
                    .map(async item => ({
                        itemId: item.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        productName: item.product.name,
                        content: item.deliveredContent!,
                        // DeliveryType is always INSTANT; no download links are needed
                        downloadLink: null,
                        deliveredAt: item.deliveredAt!.toISOString(),
                    }))
            );

            return {
                orderId: order.id,
                orderNumber: order.orderNumber,
                items: deliveryItems,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to get delivery content: ${error.message}`
            );
            throw new HttpException(
                'order.error.getDeliveryContentFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
