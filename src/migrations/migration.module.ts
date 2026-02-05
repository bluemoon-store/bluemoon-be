import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';

import { CommonModule } from 'src/common/common.module';
import { AwsModule } from 'src/common/aws/aws.module';

import { CryptoWalletSeedService } from './seed/crypto-wallet.seed';
import { ProductSeedService } from './seed/product.seed';

@Module({
    imports: [CommonModule, CommandModule, AwsModule],
    providers: [CryptoWalletSeedService, ProductSeedService],
    exports: [CryptoWalletSeedService, ProductSeedService],
})
export class MigrationModule {}
