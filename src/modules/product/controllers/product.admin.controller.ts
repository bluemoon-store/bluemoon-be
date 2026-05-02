import {
    Body,
    BadRequestException,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { ADMIN_ROLES } from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { CategoryCreateDto } from '../dtos/request/category.create.request';
import { CategoryUpdateDto } from '../dtos/request/category.update.request';
import { ProductCreateDto } from '../dtos/request/product.create.request';
import { ProductUpdateDto } from '../dtos/request/product.update.request';
import { ProductSearchDto } from '../dtos/request/product.search.request';
import { ProductListQueryDto } from '../dtos/request/product.list.request';
import { CategoryListQueryDto } from '../dtos/request/category.list.request';
import {
    AdminProductRelatedSetDto,
    AdminProductRegionCreateDto,
    AdminProductImageCreateDto,
    AdminProductVariantCreateDto,
    AdminProductVariantUpdateDto,
} from '../dtos/request/product.admin.subresource.request';
import {
    ProductResponseDto,
    ProductListResponseDto,
} from '../dtos/response/product.response';
import { CategoryResponseDto } from '../dtos/response/category.response';
import { ProductService } from '../services/product.service';
import { ProductCategoryService } from '../services/product-category.service';

@ApiTags('admin.product')
@Controller({
    path: '/admin/products',
    version: '1',
})
export class ProductAdminController {
    constructor(
        private readonly productService: ProductService,
        private readonly categoryService: ProductCategoryService
    ) {}

    @Post()
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create product' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'product.success.created',
    })
    public async create(
        @Body() payload: ProductCreateDto
    ): Promise<ProductResponseDto> {
        return this.productService.create(payload);
    }

    @Get()
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List all products (admin)' })
    @DocPaginatedResponse({
        serialization: ProductListResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.list',
    })
    public async list(
        @Query(
            new QueryTransformPipe({
                booleanFields: [
                    'isActive',
                    'isFeatured',
                    'isHot',
                    'isNew',
                    'isRestocked',
                ],
            })
        )
        query: ProductListQueryDto
    ): Promise<ApiPaginatedDataDto<ProductListResponseDto>> {
        return this.productService.findAll({
            page: query.page,
            limit: query.limit,
            categoryId: query.categoryId,
            categorySlug: query.categorySlug,
            isActive: query.isActive,
            isFeatured: query.isFeatured,
            isHot: query.isHot,
            isNew: query.isNew,
            isRestocked: query.isRestocked,
        });
    }

    @Get('search')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Search products (admin)' })
    @DocPaginatedResponse({
        serialization: ProductListResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.search',
    })
    public async search(
        @Query() query: ProductSearchDto
    ): Promise<ApiPaginatedDataDto<ProductListResponseDto>> {
        return this.productService.search(query);
    }

    // Categories (must be registered before :id routes)

    @Post('categories')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create category' })
    @DocResponse({
        serialization: CategoryResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'product.success.categoryCreated',
    })
    public async createCategory(
        @Body() payload: CategoryCreateDto
    ): Promise<CategoryResponseDto> {
        return this.categoryService.create(payload);
    }

    @Get('categories')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List all categories (admin)' })
    @DocPaginatedResponse({
        serialization: CategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.listCategories',
    })
    public async listCategories(
        @Query(new QueryTransformPipe()) query: CategoryListQueryDto
    ): Promise<ApiPaginatedDataDto<CategoryResponseDto>> {
        return this.categoryService.findAll({
            page: query.page,
            limit: query.limit,
            isActive: query.isActive,
        });
    }

    @Get('categories/:id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get category by ID' })
    @DocResponse({
        serialization: CategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.categoryFound',
    })
    public async getCategoryById(
        @Param('id') id: string
    ): Promise<CategoryResponseDto> {
        return this.categoryService.findOne(id);
    }

    @Put('categories/:id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update category' })
    @DocResponse({
        serialization: CategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.categoryUpdated',
    })
    public async updateCategory(
        @Param('id') id: string,
        @Body() payload: CategoryUpdateDto
    ): Promise<CategoryResponseDto> {
        return this.categoryService.update(id, payload);
    }

    @Delete('categories/:id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete category' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.categoryDeleted',
    })
    public async deleteCategory(
        @Param('id') id: string
    ): Promise<ApiGenericResponseDto> {
        return this.categoryService.delete(id);
    }

    @Put('categories/:id/toggle-active')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Toggle category active status' })
    @DocResponse({
        serialization: CategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.categoryActiveToggled',
    })
    public async toggleCategoryActive(
        @Param('id') id: string
    ): Promise<CategoryResponseDto> {
        return this.categoryService.toggleActive(id);
    }

    // Variants / regions / related

    @Post(':id/variants')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Add product variant' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.updated',
    })
    public async addVariant(
        @Param('id') productId: string,
        @Body() payload: AdminProductVariantCreateDto
    ): Promise<ProductResponseDto> {
        return this.productService.addVariant(productId, payload);
    }

    @Put(':id/variants/:variantId')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update product variant' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.updated',
    })
    public async updateVariant(
        @Param('id') productId: string,
        @Param('variantId') variantId: string,
        @Body() payload: AdminProductVariantUpdateDto
    ): Promise<ProductResponseDto> {
        return this.productService.updateVariant(productId, variantId, payload);
    }

    @Delete(':id/variants/:variantId')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Remove product variant (soft delete)' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.updated',
    })
    public async deleteVariant(
        @Param('id') productId: string,
        @Param('variantId') variantId: string
    ): Promise<ProductResponseDto> {
        return this.productService.deleteVariant(productId, variantId);
    }

    @Post(':id/regions')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Add product region' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.updated',
    })
    public async addRegion(
        @Param('id') productId: string,
        @Body() payload: AdminProductRegionCreateDto
    ): Promise<ProductResponseDto> {
        return this.productService.addRegion(productId, payload);
    }

    @Delete(':id/regions/:regionId')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Remove product region' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.updated',
    })
    public async deleteRegion(
        @Param('id') productId: string,
        @Param('regionId') regionId: string
    ): Promise<ProductResponseDto> {
        return this.productService.deleteRegion(productId, regionId);
    }

    @Put(':id/related')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Set related products' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.updated',
    })
    public async setRelated(
        @Param('id') productId: string,
        @Body() payload: AdminProductRelatedSetDto
    ): Promise<ProductResponseDto> {
        return this.productService.setRelatedProducts(
            productId,
            payload.relatedProductIds
        );
    }

    // Product by ID and CRUD

    @Get(':id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get product by ID (admin)' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.productFound',
    })
    public async getById(@Param('id') id: string): Promise<ProductResponseDto> {
        return this.productService.findOne(id);
    }

    @Put(':id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update product' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.updated',
    })
    public async update(
        @Param('id') id: string,
        @Body() payload: ProductUpdateDto
    ): Promise<ProductResponseDto> {
        return this.productService.update(id, payload);
    }

    @Delete(':id')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete product' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.productDeleted',
    })
    public async delete(
        @Param('id') id: string
    ): Promise<ApiGenericResponseDto> {
        return this.productService.delete(id);
    }

    @Put(':id/stock')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update product stock' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.stockUpdated',
    })
    public async updateStock(
        @Param('id') id: string,
        @Body('stockQuantity') stockQuantity: number
    ): Promise<ProductResponseDto> {
        return this.productService.updateStock(id, stockQuantity);
    }

    @Put(':id/toggle-active')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Toggle product active status' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.activeToggled',
    })
    public async toggleActive(
        @Param('id') id: string
    ): Promise<ProductResponseDto> {
        return this.productService.toggleActive(id);
    }

    @Put(':id/toggle-featured')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Toggle product featured status' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.featuredToggled',
    })
    public async toggleFeatured(
        @Param('id') id: string
    ): Promise<ProductResponseDto> {
        return this.productService.toggleFeatured(id);
    }

    @Post(':id/images')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Add image to product' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.imageAdded',
    })
    public async addImage(
        @Param('id') productId: string,
        @Body() payload: AdminProductImageCreateDto
    ): Promise<ProductResponseDto> {
        const imageKey = payload.key ?? payload.imageKey;
        if (!imageKey) {
            throw new BadRequestException('imageKey or key is required');
        }
        return this.productService.addImage(
            productId,
            imageKey,
            payload.isPrimary ?? false
        );
    }

    @Delete(':id/images/:imageId')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Remove image from product' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.imageRemoved',
    })
    public async removeImage(
        @Param('id') productId: string,
        @Param('imageId') imageId: string
    ): Promise<ProductResponseDto> {
        return this.productService.removeImage(productId, imageId);
    }

    @Put(':id/images/:imageId/primary')
    @AllowedRoles(ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Set image as primary' })
    @DocResponse({
        serialization: ProductResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'product.success.primaryImageSet',
    })
    public async setPrimaryImage(
        @Param('id') productId: string,
        @Param('imageId') imageId: string
    ): Promise<ProductResponseDto> {
        return this.productService.setPrimaryImage(productId, imageId);
    }
}
