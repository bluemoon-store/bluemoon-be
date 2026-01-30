import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';

import { WalletPublicController } from './controllers/wallet.public.controller';
import { WalletAdminController } from './controllers/wallet.admin.controller';
import { WalletService } from './services/wallet.service';

@Module({
    imports: [DatabaseModule, HelperModule],
    controllers: [WalletPublicController, WalletAdminController],
    providers: [WalletService],
    exports: [WalletService],
})
export class WalletModule {}
