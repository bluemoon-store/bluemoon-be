import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';

import { CommonModule } from 'src/common/common.module';
import { StorageModule } from 'src/common/storage/storage.module';

import { CryptoWalletSeedService } from './seed/crypto-wallet.seed';
import { ProductSeedService } from './seed/product.seed';

@Module({
    imports: [CommonModule, CommandModule, StorageModule],
    providers: [CryptoWalletSeedService, ProductSeedService],
    exports: [CryptoWalletSeedService, ProductSeedService],
})
export class MigrationModule {}
