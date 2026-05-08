import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';

import { FaqAdminController } from './controllers/faq.admin.controller';
import { FaqPublicController } from './controllers/faq.public.controller';
import { FaqService } from './services/faq.service';

@Module({
    imports: [DatabaseModule],
    controllers: [FaqAdminController, FaqPublicController],
    providers: [FaqService],
    exports: [FaqService],
})
export class FaqModule {}
