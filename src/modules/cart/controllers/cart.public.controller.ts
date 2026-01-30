import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { CartAddItemDto } from '../dtos/request/cart.add-item.request';
import { CartUpdateItemDto } from '../dtos/request/cart.update-item.request';
import { CartResponseDto } from '../dtos/response/cart.response';
import { CartService } from '../services/cart.service';

@ApiTags('public.cart')
@Controller({
    path: '/cart',
    version: '1',
})
export class CartPublicController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get user cart' })
    @DocResponse({
        serialization: CartResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'cart.success.cartFound',
    })
    public async getCart(
        @AuthUser() user: IAuthUser
    ): Promise<CartResponseDto> {
        return this.cartService.getCart(user.userId);
    }

    @Post('items')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Add item to cart' })
    @DocResponse({
        serialization: CartResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'cart.success.itemAdded',
    })
    public async addItem(
        @AuthUser() user: IAuthUser,
        @Body() payload: CartAddItemDto
    ): Promise<CartResponseDto> {
        return this.cartService.addItem(user.userId, payload);
    }

    @Put('items/:id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update cart item quantity' })
    @DocResponse({
        serialization: CartResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'cart.success.itemUpdated',
    })
    public async updateItem(
        @AuthUser() user: IAuthUser,
        @Param('id') itemId: string,
        @Body() payload: CartUpdateItemDto
    ): Promise<CartResponseDto> {
        return this.cartService.updateItem(user.userId, itemId, payload);
    }

    @Delete('items/:id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Remove item from cart' })
    @DocResponse({
        serialization: CartResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'cart.success.itemRemoved',
    })
    public async removeItem(
        @AuthUser() user: IAuthUser,
        @Param('id') itemId: string
    ): Promise<CartResponseDto> {
        return this.cartService.removeItem(user.userId, itemId);
    }

    @Delete()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Clear cart' })
    @DocResponse({
        serialization: CartResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'cart.success.cartCleared',
    })
    public async clearCart(
        @AuthUser() user: IAuthUser
    ): Promise<CartResponseDto> {
        return this.cartService.clearCart(user.userId);
    }
}
