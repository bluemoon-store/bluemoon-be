import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';

import { CartAddItemDto } from '../dtos/request/cart.add-item.request';
import { CartUpdateItemDto } from '../dtos/request/cart.update-item.request';
import {
    CartResponseDto,
    CartItemResponseDto,
} from '../dtos/response/cart.response';
import { ICartService } from '../interfaces/cart.service.interface';

@Injectable()
export class CartService implements ICartService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(CartService.name);
    }

    /**
     * Calculate cart total and metadata
     */
    private calculateCartTotals(items: any[]): {
        totalAmount: string;
        currency: string;
        totalItems: number;
    } {
        if (!items || items.length === 0) {
            return {
                totalAmount: '0',
                currency: 'USD',
                totalItems: 0,
            };
        }

        // All products should have the same currency
        const currency = items[0]?.product?.currency || 'USD';
        let totalAmount = 0;
        let totalItems = 0;

        for (const item of items) {
            if (item.product && item.product.price) {
                const price =
                    typeof item.product.price === 'string'
                        ? parseFloat(item.product.price)
                        : Number(item.product.price);
                totalAmount += price * item.quantity;
                totalItems += item.quantity;
            }
        }

        return {
            totalAmount: totalAmount.toFixed(8), // Support crypto decimals
            currency,
            totalItems,
        };
    }

    /**
     * Validate product before adding to cart
     */
    private async validateProduct(
        productId: string,
        quantity: number
    ): Promise<void> {
        const product = await this.databaseService.product.findFirst({
            where: {
                id: productId,
                deletedAt: null,
            },
        });

        if (!product) {
            throw new HttpException(
                'cart.error.productNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        if (!product.isActive) {
            throw new HttpException(
                'cart.error.productInactive',
                HttpStatus.BAD_REQUEST
            );
        }

        if (product.stockQuantity < quantity) {
            throw new HttpException(
                'cart.error.insufficientStock',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Get or create cart for user
     */
    async getOrCreateCart(userId: string): Promise<CartResponseDto> {
        try {
            let cart = await this.databaseService.cart.findUnique({
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
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!cart) {
                cart = await this.databaseService.cart.create({
                    data: {
                        userId,
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
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                });
            }

            const totals = this.calculateCartTotals(cart.items);

            return {
                ...cart,
                ...totals,
            } as CartResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to get or create cart: ${error.message}`);
            throw new HttpException(
                'cart.error.getCartFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get cart for user (creates cart if it doesn't exist)
     */
    async getCart(userId: string): Promise<CartResponseDto> {
        // Use getOrCreateCart to ensure cart always exists
        return this.getOrCreateCart(userId);
    }

    /**
     * Add item to cart
     */
    async addItem(
        userId: string,
        data: CartAddItemDto
    ): Promise<CartResponseDto> {
        try {
            // Validate product
            await this.validateProduct(data.productId, data.quantity);

            // Get or create cart
            const cart = await this.getOrCreateCart(userId);

            // Check if item already exists in cart
            const existingItem = await this.databaseService.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId: data.productId,
                },
                include: {
                    product: true,
                },
            });

            if (existingItem) {
                // Update quantity
                const newQuantity = existingItem.quantity + data.quantity;

                // Validate stock again with new quantity
                await this.validateProduct(data.productId, newQuantity);

                await this.databaseService.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQuantity },
                });
            } else {
                // Create new cart item
                await this.databaseService.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: data.productId,
                        quantity: data.quantity,
                    },
                });
            }

            // Return updated cart
            return this.getCart(userId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to add item to cart: ${error.message}`);
            throw new HttpException(
                'cart.error.addItemFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Update item quantity in cart
     */
    async updateItem(
        userId: string,
        itemId: string,
        data: CartUpdateItemDto
    ): Promise<CartResponseDto> {
        try {
            // Get cart
            const cart = await this.getOrCreateCart(userId);

            // Find cart item
            const cartItem = await this.databaseService.cartItem.findFirst({
                where: {
                    id: itemId,
                    cartId: cart.id,
                },
                include: {
                    product: true,
                },
            });

            if (!cartItem) {
                throw new HttpException(
                    'cart.error.itemNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Validate product and stock
            await this.validateProduct(cartItem.productId, data.quantity);

            // Update quantity
            await this.databaseService.cartItem.update({
                where: { id: itemId },
                data: { quantity: data.quantity },
            });

            // Return updated cart
            return this.getCart(userId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to update cart item: ${error.message}`);
            throw new HttpException(
                'cart.error.updateItemFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Remove item from cart
     */
    async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
        try {
            // Get cart
            const cart = await this.getOrCreateCart(userId);

            // Find cart item
            const cartItem = await this.databaseService.cartItem.findFirst({
                where: {
                    id: itemId,
                    cartId: cart.id,
                },
            });

            if (!cartItem) {
                throw new HttpException(
                    'cart.error.itemNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Delete cart item
            await this.databaseService.cartItem.delete({
                where: { id: itemId },
            });

            // Return updated cart
            return this.getCart(userId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to remove cart item: ${error.message}`);
            throw new HttpException(
                'cart.error.removeItemFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Clear all items from cart
     */
    async clearCart(userId: string): Promise<CartResponseDto> {
        try {
            // Get cart
            const cart = await this.getOrCreateCart(userId);

            // Delete all cart items
            await this.databaseService.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            // Return empty cart
            return this.getCart(userId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to clear cart: ${error.message}`);
            throw new HttpException(
                'cart.error.clearCartFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
