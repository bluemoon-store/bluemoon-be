import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';

import { ReviewAdminController } from './controllers/review.admin.controller';
import { ReviewPublicController } from './controllers/review.public.controller';
import { ReviewUserController } from './controllers/review.user.controller';
import { ReviewService } from './services/review.service';

@Module({
    imports: [DatabaseModule, HelperModule],
    controllers: [
        ReviewPublicController,
        ReviewUserController,
        ReviewAdminController,
    ],
    providers: [ReviewService],
    exports: [ReviewService],
})
export class ReviewModule {}
