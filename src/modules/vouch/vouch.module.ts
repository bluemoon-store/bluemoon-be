import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { StorageModule } from 'src/common/storage/storage.module';

import { VouchPublicController } from './controllers/vouch.public.controller';
import { VouchUserController } from './controllers/vouch.user.controller';
import { VouchService } from './services/vouch.service';

@Module({
    imports: [DatabaseModule, HelperModule, StorageModule],
    controllers: [VouchPublicController, VouchUserController],
    providers: [VouchService],
    exports: [VouchService],
})
export class VouchModule {}
