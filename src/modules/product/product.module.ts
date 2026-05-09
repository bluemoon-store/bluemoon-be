import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { StorageModule } from 'src/common/storage/storage.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';
import { StockLineModule } from 'src/modules/stock-line/stock-line.module';

import { ProductPublicController } from './controllers/product.public.controller';
import { ProductAdminController } from './controllers/product.admin.controller';
import { ProductService } from './services/product.service';
import { ProductCategoryService } from './services/product-category.service';

@Module({
    imports: [
        HelperModule,
        DatabaseModule,
        ActivityLogModule,
        StockLineModule,
        StorageModule,
    ],
    controllers: [ProductPublicController, ProductAdminController],
    providers: [ProductService, ProductCategoryService],
    exports: [ProductService, ProductCategoryService],
})
export class ProductModule {}
