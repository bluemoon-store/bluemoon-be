import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';

import { CommonModule } from 'src/common/common.module';
import { StorageModule } from 'src/common/storage/storage.module';

import { CryptoWalletsSeedService } from './seed/crypto-wallets.seed';
import { ProductsSeedService } from './seed/products.seed';
import { TicketsSeedService } from './seed/tickets.seed';
import { UsersSeedService } from './seed/users.seed';

@Module({
    imports: [CommonModule, CommandModule, StorageModule],
    providers: [
        CryptoWalletsSeedService,
        ProductsSeedService,
        TicketsSeedService,
        UsersSeedService,
    ],
    exports: [
        CryptoWalletsSeedService,
        ProductsSeedService,
        TicketsSeedService,
        UsersSeedService,
    ],
})
export class MigrationModule {}
