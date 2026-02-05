import { ApiProperty } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { Prisma, UserWallet } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsUUID } from 'class-validator';

export class WalletResponseDto implements UserWallet {
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
    userId: string;

    @ApiProperty({
        example: '100.50',
        description: 'Current wallet balance in USD',
    })
    @Expose()
    @Type(() => String)
    balance: Prisma.Decimal; // Prisma Decimal type (serialized as string)

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
