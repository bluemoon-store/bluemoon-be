import { faker } from '@faker-js/faker';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SparkTransactionType } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';

export class SparkTransactionDto {
    @ApiProperty({
        example: faker.string.uuid(),
        description: 'Unique identifier for the transaction',
    })
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty({
        enum: SparkTransactionType,
        example: SparkTransactionType.REFERRAL_BONUS,
        description: 'Type of spark transaction',
    })
    @Expose()
    @IsEnum(SparkTransactionType)
    type: SparkTransactionType;

    @ApiProperty({
        example: 100,
        description:
            'Amount of sparks (positive for earned, negative for spent)',
    })
    @Expose()
    @IsNumber()
    amount: number;

    @ApiProperty({
        example: 'Referral bonus',
        description: 'Reason for the transaction',
    })
    @Expose()
    @IsString()
    reason: string;

    @ApiPropertyOptional({
        example: faker.string.uuid(),
        description:
            'Reference ID related to the transaction (e.g., energy map ID)',
    })
    @Expose()
    @IsString()
    @IsOptional()
    referenceId?: string;

    @ApiProperty({
        example: faker.date.past().toISOString(),
        description: 'When the transaction was created',
    })
    @Expose()
    @IsDate()
    @Type(() => Date)
    createdAt: Date;
}

export class SparkBalanceResponseDto {
    @ApiProperty({
        example: 500,
        description: 'Current spark balance of the user',
    })
    @Expose()
    @IsNumber()
    currentBalance: number;

    @ApiProperty({
        example: 1000,
        description: 'Total sparks earned by the user',
    })
    @Expose()
    @IsNumber()
    totalEarned: number;

    @ApiProperty({
        example: 500,
        description: 'Total sparks spent by the user',
    })
    @Expose()
    @IsNumber()
    totalSpent: number;

    @ApiProperty({
        type: [SparkTransactionDto],
        description: 'Recent spark transactions',
        example: [
            {
                id: faker.string.uuid(),
                type: SparkTransactionType.REFERRAL_BONUS,
                amount: 100,
                reason: 'Referral bonus',
                referenceId: faker.string.uuid(),
                createdAt: faker.date.past().toISOString(),
            },
            {
                id: faker.string.uuid(),
                type: SparkTransactionType.DEEP_MAP_UNLOCK,
                amount: -50,
                reason: 'Deep map unlock',
                referenceId: faker.string.uuid(),
                createdAt: faker.date.past().toISOString(),
            },
        ],
    })
    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SparkTransactionDto)
    recentTransactions: SparkTransactionDto[];
}
