import { CartResponseDto } from '../dtos/response/cart.response';
import { CartAddItemDto } from '../dtos/request/cart.add-item.request';
import { CartUpdateItemDto } from '../dtos/request/cart.update-item.request';

export interface ICartService {
    getOrCreateCart(userId: string): Promise<CartResponseDto>;
    addItem(userId: string, data: CartAddItemDto): Promise<CartResponseDto>;
    updateItem(
        userId: string,
        itemId: string,
        data: CartUpdateItemDto
    ): Promise<CartResponseDto>;
    removeItem(userId: string, itemId: string): Promise<CartResponseDto>;
    clearCart(userId: string): Promise<CartResponseDto>;
    getCart(userId: string): Promise<CartResponseDto>;
}
