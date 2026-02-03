import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseService } from 'src/common/database/services/database.service';
import { CryptoCurrency } from '@prisma/client';

@Injectable()
export class CryptoWalletSeedService {
    constructor(
        private readonly logger: PinoLogger,
        private readonly databaseService: DatabaseService
    ) {
        this.logger.setContext(CryptoWalletSeedService.name);
    }

    async seed(): Promise<void> {
        this.logger.info('Seeding system wallet indexes...');

        const cryptocurrencies: CryptoCurrency[] = [
            CryptoCurrency.BTC,
            CryptoCurrency.ETH,
            CryptoCurrency.LTC,
            CryptoCurrency.BCH,
            CryptoCurrency.USDT_ERC20,
            CryptoCurrency.USDT_TRC20,
            CryptoCurrency.USDC_ERC20,
        ];

        for (const cryptocurrency of cryptocurrencies) {
            const existing =
                await this.databaseService.systemWalletIndex.findUnique({
                    where: { cryptocurrency },
                });

            if (!existing) {
                await this.databaseService.systemWalletIndex.create({
                    data: {
                        cryptocurrency,
                        nextIndex: 0,
                    },
                });

                this.logger.info(
                    `Created wallet index for ${cryptocurrency} starting at 0`
                );
            } else {
                this.logger.info(
                    `Wallet index for ${cryptocurrency} already exists (current: ${existing.nextIndex})`
                );
            }
        }

        this.logger.info('System wallet indexes seeding completed');
    }
}
