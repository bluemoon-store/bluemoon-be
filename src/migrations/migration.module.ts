import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';

import { CommonModule } from 'src/common/common.module';

import { EmailMigrationSeed } from './seed/email.seed';
import { CryptoWalletSeedService } from './seed/crypto-wallet.seed';

@Module({
    imports: [CommonModule, CommandModule],
    providers: [EmailMigrationSeed, CryptoWalletSeedService],
    exports: [EmailMigrationSeed, CryptoWalletSeedService],
})
export class MigrationModule {}
