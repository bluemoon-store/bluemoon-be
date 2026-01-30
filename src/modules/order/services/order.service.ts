import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { OrderStatus, DeliveryType } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { OrderCreateDto } from '../dtos/request/order.create.request';
import { OrderStatusUpdateDto } from '../dtos/request/order.status-update.request';
import {
    OrderResponseDto,
    OrderDetailResponseDto,
} from '../dtos/response/order.response';
import { IOrderService } from '../interfaces/order.service.interface';

@Injectable()
export class OrderService implements IOrderService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly paginationService: HelperPaginationService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(OrderService.name);
    }

    /**
     * Generate unique order number (format: ORD-YYYYMMDD-XXXXX)
     */
    async generateOrderNumber(): Promise<string> {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();
        const orderNumber = `ORD-${dateStr}-${randomStr}`;

        // Check if order number already exists (very unlikely but check anyway)
        const existing = await this.databaseService.order.findUnique({
            where: { orderNumber },
        });

        if (existing) {
            // Retry with new random string
            return this.generateOrderNumber();
        }

        return orderNumber;
    }

    /**
     * Validate cart and stock before creating order
     */
    private async validateCartForOrder(userId: string): Promise<void> {
        const cart = await this.databaseService.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            throw new HttpException(
                'order.error.cartEmpty',
                HttpStatus.BAD_REQUEST
            );
        }

        // Validate each item
        for (const item of cart.items) {
            const product = item.product;

            if (!product) {
                throw new HttpException(
                    'order.error.productNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            if (!product.isActive) {
                throw new HttpException(
                    'order.error.productInactive',
                    HttpStatus.BAD_REQUEST
                );
            }

            if (product.stockQuantity < item.quantity) {
                throw new HttpException(
                    `order.error.insufficientStock: ${product.name}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    /**
     * Calculate order total from cart items
     */
    private calculateOrderTotal(items: any[]): {
        totalAmount: string;
        currency: string;
    } {
        if (!items || items.length === 0) {
            return { totalAmount: '0', currency: 'USD' };
        }

        const currency = items[0]?.product?.currency || 'USD';
        let totalAmount = 0;

        for (const item of items) {
            if (item.product && item.product.price) {
                const price =
                    typeof item.product.price === 'string'
                        ? parseFloat(item.product.price)
                        : Number(item.product.price);
                totalAmount += price * item.quantity;
            }
        }

        return {
            totalAmount: totalAmount.toFixed(8), // Support crypto decimals
            currency,
        };
    }

    /**
     * Create order from cart
     */
    async createOrder(
        userId: string,
        data: OrderCreateDto
    ): Promise<OrderResponseDto> {
        try {
            // Validate cart and stock
            await this.validateCartForOrder(userId);

            // Get cart with items
            const cart = await this.databaseService.cart.findUnique({
                where: { userId },
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

            if (!cart || !cart.items || cart.items.length === 0) {
                throw new HttpException(
                    'order.error.cartEmpty',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Calculate totals
            const { totalAmount, currency } = this.calculateOrderTotal(
                cart.items
            );

            // Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Create order and items in transaction
            const order = await this.databaseService.$transaction(async tx => {
                // Create order
                const newOrder = await tx.order.create({
                    data: {
                        orderNumber,
                        userId,
                        totalAmount,
                        currency: data.currency || currency,
                        status: OrderStatus.PENDING,
                    },
                });

                // Create order items and update stock
                const orderItems = [];
                for (const cartItem of cart.items) {
                    const product = cartItem.product;
                    const price =
                        typeof product.price === 'string'
                            ? product.price
                            : product.price.toString();

                    // Create order item
                    const orderItem = await tx.orderItem.create({
                        data: {
                            orderId: newOrder.id,
                            productId: cartItem.productId,
                            quantity: cartItem.quantity,
                            priceAtPurchase: price,
                        },
                    });

                    // Update product stock
                    await tx.product.update({
                        where: { id: cartItem.productId },
                        data: {
                            stockQuantity: {
                                decrement: cartItem.quantity,
                            },
                        },
                    });

                    orderItems.push(orderItem);
                }

                // Clear cart
                await tx.cartItem.deleteMany({
                    where: { cartId: cart.id },
                });

                return { order: newOrder, items: orderItems };
            });

            // Fetch complete order with items
            const completeOrder = await this.databaseService.order.findUnique({
                where: { id: order.order.id },
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
                    orderId: order.order.id,
                    orderNumber,
                    userId,
                    totalAmount,
                },
                'Order created'
            );

            return completeOrder as OrderResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to create order: ${error.message}`);
            throw new HttpException(
                'order.error.createOrderFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get order history for user
     */
    async getOrderHistory(
        userId: string,
        options?: {
            page?: number;
            limit?: number;
            status?: OrderStatus;
        }
    ): Promise<ApiPaginatedDataDto<OrderResponseDto>> {
        try {
            const where: any = {
                userId,
                deletedAt: null,
            };

            if (options?.status) {
                where.status = options.status;
            }

            const result = await this.paginationService.paginate(
                this.databaseService.order,
                {
                    page: options?.page ?? 1,
                    limit: options?.limit ?? 10,
                },
                {
                    where,
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
                    orderBy: { createdAt: 'desc' },
                }
            );

            return result;
        } catch (error) {
            this.logger.error(`Failed to get order history: ${error.message}`);
            throw new HttpException(
                'order.error.getOrderHistoryFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get order detail
     */
    async getOrderDetail(
        orderId: string,
        userId?: string
    ): Promise<OrderDetailResponseDto> {
        try {
            const where: any = {
                id: orderId,
                deletedAt: null,
            };

            // If userId provided, ensure user owns the order
            if (userId) {
                where.userId = userId;
            }

            const order = await this.databaseService.order.findFirst({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            userName: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
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
                    cryptoPayment: true,
                },
            });

            if (!order) {
                throw new HttpException(
                    'order.error.orderNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            return order as OrderDetailResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to get order detail: ${error.message}`);
            throw new HttpException(
                'order.error.getOrderDetailFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Update order status
     */
    async updateOrderStatus(
        orderId: string,
        data: OrderStatusUpdateDto
    ): Promise<OrderResponseDto> {
        try {
            const order = await this.databaseService.order.findFirst({
                where: {
                    id: orderId,
                    deletedAt: null,
                },
            });

            if (!order) {
                throw new HttpException(
                    'order.error.orderNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            const updateData: any = {
                status: data.status,
            };

            // Set completedAt if status is COMPLETED
            if (data.status === OrderStatus.COMPLETED && !order.completedAt) {
                updateData.completedAt = new Date();
            }

            // Set cancelledAt if status is CANCELLED
            if (data.status === OrderStatus.CANCELLED && !order.cancelledAt) {
                updateData.cancelledAt = new Date();
            }

            const updatedOrder = await this.databaseService.order.update({
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
                    oldStatus: order.status,
                    newStatus: data.status,
                },
                'Order status updated'
            );

            return updatedOrder as OrderResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to update order status: ${error.message}`
            );
            throw new HttpException(
                'order.error.updateOrderStatusFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Cancel order
     */
    async cancelOrder(
        orderId: string,
        userId: string
    ): Promise<OrderResponseDto> {
        try {
            const order = await this.databaseService.order.findFirst({
                where: {
                    id: orderId,
                    userId,
                    deletedAt: null,
                },
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

            // Only allow cancellation if order is PENDING
            if (order.status !== OrderStatus.PENDING) {
                throw new HttpException(
                    'order.error.cannotCancelOrder',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Restore stock and cancel order in transaction
            const cancelledOrder = await this.databaseService.$transaction(
                async tx => {
                    // Restore stock for each item
                    for (const item of order.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stockQuantity: {
                                    increment: item.quantity,
                                },
                            },
                        });
                    }

                    // Update order status
                    return await tx.order.update({
                        where: { id: orderId },
                        data: {
                            status: OrderStatus.CANCELLED,
                            cancelledAt: new Date(),
                        },
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
                }
            );

            this.logger.info({ orderId, userId }, 'Order cancelled');
            return cancelledOrder as OrderResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to cancel order: ${error.message}`);
            throw new HttpException(
                'order.error.cancelOrderFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get all orders (admin)
     */
    async getAllOrders(options?: {
        page?: number;
        limit?: number;
        status?: OrderStatus;
        userId?: string;
    }): Promise<ApiPaginatedDataDto<OrderDetailResponseDto>> {
        try {
            const where: any = {
                deletedAt: null,
            };

            if (options?.status) {
                where.status = options.status;
            }

            if (options?.userId) {
                where.userId = options.userId;
            }

            const result = await this.paginationService.paginate(
                this.databaseService.order,
                {
                    page: options?.page ?? 1,
                    limit: options?.limit ?? 10,
                },
                {
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                userName: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
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
                        cryptoPayment: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }
            );

            return result;
        } catch (error) {
            this.logger.error(`Failed to get all orders: ${error.message}`);
            throw new HttpException(
                'order.error.getAllOrdersFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
