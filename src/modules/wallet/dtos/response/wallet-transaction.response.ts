import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { WalletTransaction, WalletTransactionType } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsString, IsDate, IsUUID, IsEnum, IsOptional } from 'class-validator';

export class WalletTransactionResponseDto implements WalletTransaction {
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
    walletId: string;

    @ApiProperty({
        enum: WalletTransactionType,
        example: WalletTransactionType.DEPOSIT,
    })
    @Expose()
    @IsEnum(WalletTransactionType)
    type: WalletTransactionType;

    @ApiProperty({
        example: '50.00',
        description: 'Transaction amount',
    })
    @Expose()
    @IsString()
    amount: any; // Prisma Decimal type (serialized as string)

    @ApiProperty({
        example: '150.00',
        description: 'Balance after transaction',
    })
    @Expose()
    @IsString()
    balance: any; // Prisma Decimal type (serialized as string)

    @ApiProperty({
        example: 'Deposit via admin',
    })
    @Expose()
    @IsString()
    description: string;

    @ApiPropertyOptional({
        example: faker.string.uuid(),
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsString()
    referenceId: string | null;

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
}
