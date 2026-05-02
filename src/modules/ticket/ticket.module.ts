import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from 'src/common/database/database.module';
import { FileService } from 'src/common/file/services/files.service';
import { HelperModule } from 'src/common/helper/helper.module';
import { RequestModule } from 'src/common/request/request.module';
import { StorageModule } from 'src/common/storage/storage.module';

import { TicketAdminController } from './controllers/ticket.admin.controller';
import { TicketPublicController } from './controllers/ticket.public.controller';
import { TicketGateway } from './gateways/ticket.gateway';
import { TicketMessageService } from './services/ticket-message.service';
import { TicketService } from './services/ticket.service';

@Module({
    imports: [
        DatabaseModule,
        HelperModule,
        RequestModule,
        StorageModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('auth.accessToken.secret'),
            }),
        }),
    ],
    controllers: [TicketPublicController, TicketAdminController],
    providers: [
        TicketService,
        TicketMessageService,
        TicketGateway,
        FileService,
    ],
    exports: [TicketService, TicketMessageService],
})
export class TicketModule {}
