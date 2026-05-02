import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';

import { ProductPublicController } from './controllers/product.public.controller';
import { ProductAdminController } from './controllers/product.admin.controller';
import { ProductService } from './services/product.service';
import { ProductCategoryService } from './services/product-category.service';

@Module({
    imports: [HelperModule, DatabaseModule, ActivityLogModule],
    controllers: [ProductPublicController, ProductAdminController],
    providers: [ProductService, ProductCategoryService],
    exports: [ProductService, ProductCategoryService],
})
export class ProductModule {}
