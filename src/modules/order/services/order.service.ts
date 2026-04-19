import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { OrderStatus, Prisma } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { WalletService } from 'src/modules/wallet/services/wallet.service';

import { OrderCreateDto } from '../dtos/request/order.create.request';
import { OrderStatusUpdateDto } from '../dtos/request/order.status-update.request';
import {
    OrderResponseDto,
    OrderDetailResponseDto,
} from '../dtos/response/order.response';
import { IOrderService } from '../interfaces/order.service.interface';
import { calculateLineItemsTotals } from 'src/common/utils/commerce.util';
import {
    BUYER_PROTECTION_FEE_USD,
    generateOrderNumberString,
} from '../utils/order.util';
import { OrderDeliveryService } from './order-delivery.service';

@Injectable()
export class OrderService implements IOrderService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly paginationService: HelperPaginationService,
        private readonly deliveryService: OrderDeliveryService,
        private readonly walletService: WalletService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(OrderService.name);
    }

    /**
     * Generate unique order number (format: ORD-YYYYMMDD-XXXXX)
     */
    async generateOrderNumber(): Promise<string> {
        const orderNumber = generateOrderNumberString();

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

            if (item.variantId) {
                const variant =
                    await this.databaseService.productVariant.findFirst({
                        where: {
                            id: item.variantId,
                            productId: item.productId,
                            deletedAt: null,
                            isActive: true,
                        },
                    });

                if (!variant) {
                    throw new HttpException(
                        `order.error.variantInvalid: ${product.name}`,
                        HttpStatus.BAD_REQUEST
                    );
                }

                if (variant.stockQuantity < item.quantity) {
                    throw new HttpException(
                        `order.error.insufficientStock: ${product.name}`,
                        HttpStatus.BAD_REQUEST
                    );
                }
            } else if (product.stockQuantity < item.quantity) {
                throw new HttpException(
                    `order.error.insufficientStock: ${product.name}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
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

            // Calculate totals (subtotal from cart line snapshots)
            const { totalAmount, currency } = calculateLineItemsTotals(
                cart.items
            );
            const subtotal = parseFloat(totalAmount);
            const buyerProtection = Boolean(data.buyerProtection);
            const buyerProtectionUsd = buyerProtection
                ? BUYER_PROTECTION_FEE_USD
                : 0;
            const finalTotalUsd = Math.max(0, subtotal + buyerProtectionUsd);
            if (finalTotalUsd <= 0) {
                throw new HttpException(
                    'order.error.invalidTotal',
                    HttpStatus.BAD_REQUEST
                );
            }
            const totalAmountStr = finalTotalUsd.toFixed(8);

            // Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Create order and items in transaction
            const order = await this.databaseService.$transaction(async tx => {
                // Create order
                const newOrder = await tx.order.create({
                    data: {
                        orderNumber,
                        userId,
                        totalAmount: totalAmountStr,
                        currency: data.currency || currency,
                        status: OrderStatus.PENDING,
                        buyerProtection,
                        buyerProtectionAmount:
                            buyerProtectionUsd > 0
                                ? new Prisma.Decimal(
                                      buyerProtectionUsd.toFixed(8)
                                  )
                                : null,
                    },
                });

                // Create order items and update stock
                const orderItems = [];
                for (const cartItem of cart.items) {
                    const product = cartItem.product;
                    const basePrice =
                        typeof product.price === 'string'
                            ? product.price
                            : product.price.toString();

                    const priceAtPurchase =
                        cartItem.unitPrice != null
                            ? cartItem.unitPrice.toString()
                            : basePrice;

                    let variantLabel: string | null = null;
                    if (cartItem.variantId) {
                        const v = await tx.productVariant.findUnique({
                            where: { id: cartItem.variantId },
                        });
                        variantLabel = v?.label ?? null;
                    }

                    const orderItem = await tx.orderItem.create({
                        data: {
                            orderId: newOrder.id,
                            productId: cartItem.productId,
                            quantity: cartItem.quantity,
                            priceAtPurchase,
                            variantId: cartItem.variantId,
                            variantLabel,
                            regionLabel: cartItem.regionLabel || null,
                            regionCountry: cartItem.regionCountry || null,
                        },
                    });

                    if (cartItem.variantId) {
                        await tx.productVariant.update({
                            where: { id: cartItem.variantId },
                            data: {
                                stockQuantity: {
                                    decrement: cartItem.quantity,
                                },
                            },
                        });
                    } else {
                        await tx.product.update({
                            where: { id: cartItem.productId },
                            data: {
                                stockQuantity: {
                                    decrement: cartItem.quantity,
                                },
                            },
                        });
                    }

                    orderItems.push(orderItem);
                }

                // Clear cart
                await tx.cartItem.deleteMany({
                    where: { cartId: cart.id },
                });

                return { order: newOrder, items: orderItems };
            });

            // Fetch complete order with items and crypto payment
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
                    cryptoPayment: true,
                },
            });

            this.logger.info(
                {
                    orderId: order.order.id,
                    orderNumber,
                    userId,
                    totalAmount: totalAmountStr,
                },
                'Order created'
            );

            // Note: Crypto payment creation is handled via separate endpoint
            // POST /v1/crypto-payments/orders/:orderId
            // This allows for better separation of concerns and error handling

            return completeOrder as unknown as OrderResponseDto;
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

            const result =
                await this.paginationService.paginate<OrderResponseDto>(
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
                            cryptoPayment: true,
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
        userId?: string,
        skipOwnershipCheck = false
    ): Promise<OrderDetailResponseDto> {
        try {
            const order = await this.databaseService.order.findFirst({
                where: {
                    id: orderId,
                    deletedAt: null,
                },
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

            if (!skipOwnershipCheck) {
                if (!userId || order.userId !== userId) {
                    throw new HttpException(
                        'order.error.orderNotFound',
                        HttpStatus.NOT_FOUND
                    );
                }
            }

            return order as unknown as OrderDetailResponseDto;
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
                    cryptoPayment: true,
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

            // Process instant delivery if status changed to COMPLETED
            if (data.status === OrderStatus.COMPLETED) {
                try {
                    await this.deliveryService.processInstantDelivery(orderId);
                } catch (deliveryError) {
                    this.logger.warn(
                        {
                            orderId,
                            error: deliveryError?.message,
                        },
                        'Failed to process instant delivery after status update'
                    );
                }
            }

            return updatedOrder as unknown as OrderResponseDto;
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
     * Refund order: update status to REFUNDED and refund amount to user wallet
     */
    async refundOrder(orderId: string): Promise<ApiGenericResponseDto> {
        try {
            const order = await this.databaseService.order.findFirst({
                where: { id: orderId, deletedAt: null },
            });

            if (!order) {
                throw new HttpException(
                    'order.error.orderNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            if (
                order.status !== OrderStatus.COMPLETED &&
                order.status !== OrderStatus.CANCELLED
            ) {
                throw new HttpException(
                    'order.error.cannotRefundOrder',
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.updateOrderStatus(orderId, {
                status: OrderStatus.REFUNDED,
            });

            const totalAmount =
                typeof order.totalAmount === 'string'
                    ? parseFloat(order.totalAmount)
                    : Number(order.totalAmount);

            if (order.userId) {
                await this.walletService.refundBalance(
                    order.userId,
                    totalAmount,
                    `Refund for order ${order.orderNumber}`,
                    order.id
                );
            }

            this.logger.info({ orderId }, 'Order refunded successfully');

            return {
                success: true,
                message: 'order.success.refunded',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to refund order: ${error.message}`);
            throw new HttpException(
                'order.error.refundFailed',
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
                    cryptoPayment: true,
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
                        if (item.variantId) {
                            await tx.productVariant.update({
                                where: { id: item.variantId },
                                data: {
                                    stockQuantity: {
                                        increment: item.quantity,
                                    },
                                },
                            });
                        } else {
                            await tx.product.update({
                                where: { id: item.productId },
                                data: {
                                    stockQuantity: {
                                        increment: item.quantity,
                                    },
                                },
                            });
                        }
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
                            cryptoPayment: true,
                        },
                    });
                }
            );

            this.logger.info({ orderId, userId }, 'Order cancelled');
            return cancelledOrder as unknown as OrderResponseDto;
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

            const result =
                await this.paginationService.paginate<OrderDetailResponseDto>(
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
