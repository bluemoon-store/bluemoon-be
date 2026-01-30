import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';

import { CartPublicController } from './controllers/cart.public.controller';
import { CartService } from './services/cart.service';

@Module({
    imports: [DatabaseModule],
    controllers: [CartPublicController],
    providers: [CartService],
    exports: [CartService],
})
export class CartModule {}
