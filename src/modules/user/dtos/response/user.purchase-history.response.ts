import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import {
    Order,
    OrderItem,
    Product,
    ProductCategory,
    ProductImage,
    CryptoPayment,
    OrderStatus,
    PaymentStatus,
    CryptoCurrency,
} from '@prisma/client';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsNumber,
    IsString,
    IsOptional,
    IsBoolean,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class PurchaseHistoryProductImageDto {
    @ApiProperty()
    @Expose()
    @IsString()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    key: string;

    @ApiProperty()
    @Expose()
    @IsString()
    @IsOptional()
    url?: string | null;

    @ApiProperty()
    @Expose()
    @IsBoolean()
    isPrimary: boolean;
}

export class PurchaseHistoryCategoryDto {
    @ApiProperty()
    @Expose()
    @IsString()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    name: string;

    @ApiProperty()
    @Expose()
    @IsString()
    slug: string;
}

export class PurchaseHistoryProductDto {
    @ApiProperty()
    @Expose()
    @IsString()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    name: string;

    @ApiProperty()
    @Expose()
    @IsString()
    slug: string;

    @ApiProperty()
    @Expose()
    @Type(() => PurchaseHistoryCategoryDto)
    category: PurchaseHistoryCategoryDto;

    @ApiProperty({ type: [PurchaseHistoryProductImageDto] })
    @Expose()
    @Type(() => PurchaseHistoryProductImageDto)
    @IsArray()
    images: PurchaseHistoryProductImageDto[];
}

export class PurchaseHistoryOrderItemDto {
    @ApiProperty()
    @Expose()
    @IsString()
    id: string;

    @ApiProperty()
    @Expose()
    @IsNumber()
    quantity: number;

    @ApiProperty()
    @Expose()
    @IsNumber()
    priceAtPurchase: number;

    @ApiProperty()
    @Expose()
    @IsString()
    @IsOptional()
    deliveredContent?: string | null;

    @ApiProperty()
    @Expose()
    @IsDate()
    @IsOptional()
    deliveredAt?: Date | null;

    @ApiProperty()
    @Expose()
    @Type(() => PurchaseHistoryProductDto)
    product: PurchaseHistoryProductDto;
}

export class PurchaseHistoryCryptoPaymentDto {
    @ApiProperty()
    @Expose()
    @IsString()
    id: string;

    @ApiProperty({ enum: CryptoCurrency })
    @Expose()
    @IsEnum(CryptoCurrency)
    cryptocurrency: CryptoCurrency;

    @ApiProperty()
    @Expose()
    @IsString()
    paymentAddress: string;

    @ApiProperty()
    @Expose()
    @IsNumber()
    amount: number;

    @ApiProperty()
    @Expose()
    @IsNumber()
    amountUsd: number;

    @ApiProperty({ enum: PaymentStatus })
    @Expose()
    @IsEnum(PaymentStatus)
    status: PaymentStatus;

    @ApiProperty()
    @Expose()
    @IsString()
    @IsOptional()
    txHash?: string | null;
}

export class PurchaseHistoryOrderDto {
    @ApiProperty()
    @Expose()
    @IsString()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    orderNumber: string;

    @ApiProperty({ enum: OrderStatus })
    @Expose()
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @ApiProperty()
    @Expose()
    @IsNumber()
    totalAmount: number;

    @ApiProperty()
    @Expose()
    @IsString()
    currency: string;

    @ApiProperty({ type: [PurchaseHistoryOrderItemDto] })
    @Expose()
    @Type(() => PurchaseHistoryOrderItemDto)
    @IsArray()
    items: PurchaseHistoryOrderItemDto[];

    @ApiProperty({ type: PurchaseHistoryCryptoPaymentDto, required: false })
    @Expose()
    @Type(() => PurchaseHistoryCryptoPaymentDto)
    @IsOptional()
    cryptoPayment?: PurchaseHistoryCryptoPaymentDto | null;

    @ApiProperty()
    @Expose()
    @IsDate()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    @IsDate()
    @IsOptional()
    completedAt?: Date | null;
}

export class PurchaseHistoryResponseDto {
    @ApiProperty({ type: [PurchaseHistoryOrderDto] })
    @Expose()
    @Type(() => PurchaseHistoryOrderDto)
    @IsArray()
    orders: PurchaseHistoryOrderDto[];
}
