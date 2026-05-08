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
import {
    READ_ADMIN_ROLES,
    STAFF_OPERATIONS_ROLES,
} from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';

import { FaqCreateCategoryRequestDto } from '../dtos/request/faq.create-category.request';
import { FaqCreateItemRequestDto } from '../dtos/request/faq.create-item.request';
import { FaqReorderRequestDto } from '../dtos/request/faq.reorder.request';
import { FaqUpdateCategoryRequestDto } from '../dtos/request/faq.update-category.request';
import { FaqUpdateItemRequestDto } from '../dtos/request/faq.update-item.request';
import {
    FaqCategoryResponseDto,
    FaqItemResponseDto,
} from '../dtos/response/faq.response';
import { FaqService } from '../services/faq.service';

@ApiTags('admin.faq')
@Controller({ path: '/admin/faq', version: '1' })
export class FaqAdminController {
    constructor(private readonly faqService: FaqService) {}

    @Get('categories')
    @AllowedRoles(READ_ADMIN_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List FAQ categories with items' })
    @DocResponse({
        serialization: FaqCategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'faq.success.list',
    })
    async listCategories(): Promise<FaqCategoryResponseDto[]> {
        return this.faqService.listCategories();
    }

    @Post('categories')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create FAQ category' })
    @DocResponse({
        serialization: FaqCategoryResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'faq.success.categoryCreated',
    })
    async createCategory(
        @Body() payload: FaqCreateCategoryRequestDto
    ): Promise<FaqCategoryResponseDto> {
        return this.faqService.createCategory(payload);
    }

    @Put('categories/:id')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update FAQ category' })
    @DocResponse({
        serialization: FaqCategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'faq.success.categoryUpdated',
    })
    async updateCategory(
        @Param('id') id: string,
        @Body() payload: FaqUpdateCategoryRequestDto
    ): Promise<FaqCategoryResponseDto> {
        return this.faqService.updateCategory(id, payload);
    }

    @Delete('categories/:id')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete FAQ category' })
    async deleteCategory(
        @Param('id') id: string
    ): Promise<{ success: boolean }> {
        return this.faqService.deleteCategory(id);
    }

    @Put('categories/reorder')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Reorder FAQ categories' })
    async reorderCategories(
        @Body() payload: FaqReorderRequestDto
    ): Promise<{ success: boolean }> {
        return this.faqService.reorderCategories(payload.orderedIds);
    }

    @Post('categories/:categoryId/items')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create FAQ item' })
    @DocResponse({
        serialization: FaqItemResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'faq.success.itemCreated',
    })
    async createItem(
        @Param('categoryId') categoryId: string,
        @Body() payload: FaqCreateItemRequestDto
    ): Promise<FaqItemResponseDto> {
        return this.faqService.createItem(categoryId, payload);
    }

    @Put('items/:id')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update FAQ item' })
    @DocResponse({
        serialization: FaqItemResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'faq.success.itemUpdated',
    })
    async updateItem(
        @Param('id') id: string,
        @Body() payload: FaqUpdateItemRequestDto
    ): Promise<FaqItemResponseDto> {
        return this.faqService.updateItem(id, payload);
    }

    @Delete('items/:id')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete FAQ item' })
    async deleteItem(@Param('id') id: string): Promise<{ success: boolean }> {
        return this.faqService.deleteItem(id);
    }

    @Put('categories/:categoryId/items/reorder')
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Reorder FAQ items in category' })
    async reorderItems(
        @Param('categoryId') categoryId: string,
        @Body() payload: FaqReorderRequestDto
    ): Promise<{ success: boolean }> {
        return this.faqService.reorderItems(categoryId, payload.orderedIds);
    }
}
