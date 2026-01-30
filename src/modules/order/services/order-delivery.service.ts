import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DeliveryType, OrderStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { AwsS3Service } from 'src/common/aws/services/aws.s3.service';

import { OrderDeliverDto } from '../dtos/request/order.deliver.request';
import { OrderResponseDto } from '../dtos/response/order.response';
import { OrderDeliveryResponseDto } from '../dtos/response/order-delivery.response';
import { IOrderDeliveryService } from '../interfaces/order-delivery.service.interface';

@Injectable()
export class OrderDeliveryService implements IOrderDeliveryService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly awsS3Service: AwsS3Service,
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

            // Only process if order is PAYMENT_RECEIVED or PROCESSING
            if (
                order.status !== OrderStatus.PAYMENT_RECEIVED &&
                order.status !== OrderStatus.PROCESSING
            ) {
                throw new HttpException(
                    'order.error.invalidOrderStatusForDelivery',
                    HttpStatus.BAD_REQUEST
                );
            }

            const deliveryItems = [];
            const now = new Date();

            // Process each item
            for (const item of order.items) {
                if (
                    item.product.deliveryType === DeliveryType.INSTANT &&
                    !item.deliveredContent
                ) {
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

            // Update order status to COMPLETED if all items are delivered
            const allDelivered = order.items.every(
                item => item.deliveredAt !== null
            );
            if (allDelivered) {
                await this.databaseService.order.update({
                    where: { id: orderId },
                    data: {
                        status: OrderStatus.COMPLETED,
                        completedAt: now,
                    },
                });
            } else {
                // Update to PROCESSING if some items still need manual delivery
                await this.databaseService.order.update({
                    where: { id: orderId },
                    data: {
                        status: OrderStatus.PROCESSING,
                    },
                });
            }

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
            }) as Promise<OrderResponseDto>;
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

            // Only allow delivery if order is PAYMENT_RECEIVED or PROCESSING
            if (
                order.status !== OrderStatus.PAYMENT_RECEIVED &&
                order.status !== OrderStatus.PROCESSING
            ) {
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

            // Update order status
            const updateData: any = {};
            if (allDelivered) {
                updateData.status = OrderStatus.COMPLETED;
                updateData.completedAt = now;
            } else {
                updateData.status = OrderStatus.PROCESSING;
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

            return finalOrder as OrderResponseDto;
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

            // Only return content if order is COMPLETED or PROCESSING
            if (
                order.status !== OrderStatus.COMPLETED &&
                order.status !== OrderStatus.PROCESSING
            ) {
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
                        productName: item.product.name,
                        content: item.deliveredContent!,
                        downloadLink:
                            item.product.deliveryType === DeliveryType.DOWNLOAD
                                ? await this.generateDownloadLink(
                                      orderId,
                                      item.id
                                  )
                                : null,
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

    /**
     * Generate download link for order item
     */
    async generateDownloadLink(
        orderId: string,
        itemId: string
    ): Promise<string> {
        try {
            const orderItem = await this.databaseService.orderItem.findUnique({
                where: { id: itemId },
                include: {
                    order: true,
                    product: true,
                },
            });

            if (!orderItem) {
                throw new HttpException(
                    'order.error.orderItemNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Verify order belongs to user
            if (orderItem.order.id !== orderId) {
                throw new HttpException(
                    'order.error.orderItemMismatch',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Check if product has download content
            if (orderItem.product.deliveryType !== DeliveryType.DOWNLOAD) {
                throw new HttpException(
                    'order.error.notDownloadable',
                    HttpStatus.BAD_REQUEST
                );
            }

            // If deliveryContent contains S3 key, generate presigned URL
            if (orderItem.deliveredContent) {
                // Check if it's an S3 key (starts with common prefixes)
                if (
                    orderItem.deliveredContent.startsWith('downloads/') ||
                    orderItem.deliveredContent.startsWith('products/files/')
                ) {
                    // Generate presigned download URL (valid for 1 hour)
                    const url = await this.awsS3Service.getPresignedUploadUrl(
                        orderItem.deliveredContent,
                        'application/octet-stream',
                        3600
                    );
                    return url.url;
                }

                // If it's already a URL, return it
                if (orderItem.deliveredContent.startsWith('http')) {
                    return orderItem.deliveredContent;
                }
            }

            // Fallback: use product's deliveryContent
            if (orderItem.product.deliveryContent) {
                if (orderItem.product.deliveryContent.startsWith('http')) {
                    return orderItem.product.deliveryContent;
                }
            }

            throw new HttpException(
                'order.error.downloadLinkNotAvailable',
                HttpStatus.NOT_FOUND
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to generate download link: ${error.message}`
            );
            throw new HttpException(
                'order.error.generateDownloadLinkFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
