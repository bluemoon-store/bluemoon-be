import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';

import { CouponAdminController } from './controllers/coupon.admin.controller';
import { CouponPublicController } from './controllers/coupon.public.controller';
import { CouponService } from './services/coupon.service';

@Module({
    imports: [HelperModule, DatabaseModule],
    controllers: [CouponAdminController, CouponPublicController],
    providers: [CouponService],
    exports: [CouponService],
})
export class CouponModule {}
