import { Controller, Get, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';

import { ProductSearchDto } from '../dtos/request/product.search.request';
import {
    ProductResponseDto,
    ProductListResponseDto,
} from '../dtos/response/product.response';
import { CategoryResponseDto } from '../dtos/response/category.response';
import { ProductService } from '../services/product.service';
import { ProductCategoryService } from '../services/product-category.service';

@ApiTags('public.product')
@Controller({
    path: '/products',
    version: '1',
})
export class ProductPublicController {
    constructor(
        private readonly productService: ProductService,
        private readonly categoryService: ProductCategoryService
    ) {}

    @Get()
    @PublicRoute()
    @ApiOperation({ summary: 'List products' })
    @DocPaginatedResponse({
        serialization: ProductListResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.list',
    })
    public async list(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('categoryId') categoryId?: string,
        @Query('isActive') isActive?: boolean,
        @Query('isFeatured') isFeatured?: boolean
    ) {
        return this.productService.findAll({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            categoryId,
            isActive: isActive !== undefined ? isActive === true : undefined,
            isFeatured:
                isFeatured !== undefined ? isFeatured === true : undefined,
        });
    }

    @Get('search')
    @PublicRoute()
    @ApiOperation({ summary: 'Search products with filters' })
    @DocPaginatedResponse({
        serialization: ProductListResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.search',
    })
    public async search(@Query() query: ProductSearchDto) {
        return this.productService.search(query);
    }

    @Get('categories')
    @PublicRoute()
    @ApiOperation({ summary: 'List product categories' })
    @DocPaginatedResponse({
        serialization: CategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.listCategories',
    })
    public async listCategories(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('isActive') isActive?: boolean
    ) {
        return this.categoryService.findAll({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            isActive: isActive !== undefined ? isActive === true : undefined,
        });
    }

    @Get('categories/:slug')
    @PublicRoute()
    @ApiOperation({ summary: 'Get category by slug' })
    @DocResponse({
        serialization: CategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.categoryFound',
    })
    public async getCategoryBySlug(
        @Param('slug') slug: string
    ): Promise<CategoryResponseDto> {
        return this.categoryService.findBySlug(slug);
    }

    @Get('categories/:id/products')
    @PublicRoute()
    @ApiOperation({ summary: 'Get products by category' })
    @DocPaginatedResponse({
        serialization: ProductListResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.listByCategory',
    })
    public async getProductsByCategory(
        @Param('id') categoryId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.productService.findAll({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            categoryId,
            isActive: true, // Only show active products
        });
    }

    @Get(':id')
    @PublicRoute()
    @ApiOperation({ summary: 'Get product by ID' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.productFound',
    })
    public async getById(@Param('id') id: string): Promise<ProductResponseDto> {
        return this.productService.findOne(id);
    }

    @Get('slug/:slug')
    @PublicRoute()
    @ApiOperation({ summary: 'Get product by slug' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.productFound',
    })
    public async getBySlug(
        @Param('slug') slug: string
    ): Promise<ProductResponseDto> {
        return this.productService.findBySlug(slug);
    }
}
