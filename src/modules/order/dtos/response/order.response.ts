import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { Order, OrderItem, OrderStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
    IsString,
    IsDate,
    IsUUID,
    IsEnum,
    IsInt,
    IsOptional,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { ProductListResponseDto } from 'src/modules/product/dtos/response/product.response';
import { CryptoPaymentResponseDto } from 'src/modules/crypto-payment/dtos/response/crypto-payment.response';

export class OrderItemResponseDto implements OrderItem {
    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    orderId: string;

    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    productId: string;

    @ApiProperty({
        example: 2,
    })
    @Expose()
    @IsInt()
    quantity: number;

    @ApiProperty({
        example: '99.99',
    })
    @Expose()
    @IsString()
    priceAtPurchase: any; // Prisma Decimal type

    @ApiPropertyOptional({
        example: 'Your product key: ABC123XYZ',
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsString()
    deliveredContent: string | null;

    @ApiPropertyOptional({
        example: faker.date.recent().toISOString(),
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsDate()
    deliveredAt: Date | null;

    @ApiProperty({
        example: faker.date.past().toISOString(),
    })
    @Expose()
    @IsDate()
    createdAt: Date;

    @ApiProperty({
        example: faker.date.recent().toISOString(),
    })
    @Expose()
    @IsDate()
    updatedAt: Date;

    @ApiPropertyOptional({
        type: ProductListResponseDto,
    })
    @Expose()
    @IsOptional()
    @Type(() => ProductListResponseDto)
    @ValidateNested()
    product?: ProductListResponseDto;
}

export class OrderResponseDto implements Order {
    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty({
        example: 'ORD-20260130-ABC12',
    })
    @Expose()
    @IsString()
    orderNumber: string;

    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    userId: string;

    @ApiProperty({
        enum: OrderStatus,
        example: OrderStatus.PENDING,
    })
    @Expose()
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @ApiProperty({
        example: '199.98',
    })
    @Expose()
    @IsString()
    totalAmount: any; // Prisma Decimal type

    @ApiProperty({
        example: 'USD',
    })
    @Expose()
    @IsString()
    currency: string;

    @ApiProperty({
        example: faker.date.past().toISOString(),
    })
    @Expose()
    @IsDate()
    createdAt: Date;

    @ApiProperty({
        example: faker.date.recent().toISOString(),
    })
    @Expose()
    @IsDate()
    updatedAt: Date;

    @ApiPropertyOptional({
        example: faker.date.recent().toISOString(),
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsDate()
    completedAt: Date | null;

    @ApiPropertyOptional({
        example: null,
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsDate()
    cancelledAt: Date | null;

    @ApiPropertyOptional({
        example: faker.date.past().toISOString(),
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsDate()
    deletedAt: Date | null;

    @ApiPropertyOptional({
        type: [OrderItemResponseDto],
    })
    @Expose()
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemResponseDto)
    items?: OrderItemResponseDto[];

    @ApiPropertyOptional({
        type: CryptoPaymentResponseDto,
        description: 'Crypto payment details (if payment method is CRYPTO)',
    })
    @Expose()
    @IsOptional()
    @ValidateNested()
    @Type(() => CryptoPaymentResponseDto)
    cryptoPayment?: CryptoPaymentResponseDto;
}

export class OrderDetailResponseDto extends OrderResponseDto {
    @ApiProperty({
        type: [OrderItemResponseDto],
    })
    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemResponseDto)
    items: OrderItemResponseDto[];
}
