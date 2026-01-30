import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
} from 'class-validator';

export class CategoryCreateDto {
    @ApiProperty({
        example: faker.commerce.department(),
        description: 'Category name',
    })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({
        example: faker.helpers.slugify(faker.commerce.department()),
        description: 'URL-friendly slug (auto-generated if not provided)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @ApiPropertyOptional({
        example: faker.lorem.paragraph(),
        description: 'Category description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        example: 'categories/icons/electronics.png',
        description: 'S3 key for category icon',
    })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({
        example: true,
        default: true,
        description: 'Whether the category is active',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        example: 0,
        default: 0,
        description: 'Sort order for display',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}
