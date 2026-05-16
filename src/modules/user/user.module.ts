import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { DatabaseModule } from 'src/common/database/database.module';
import { CommonFileModule } from 'src/common/file/file.module';
import { ActivityLogModule } from 'src/modules/activity-log/activity-log.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';

import { UserAdminController } from './controllers/user.admin.controller';
import { UserPublicController } from './controllers/user.public.controller';
import { UserTeamController } from './controllers/user.team.controller';
import { UserService } from './services/user.service';
import { UserTeamService } from './services/user.team.service';

@Module({
    imports: [
        HelperModule,
        DatabaseModule,
        WalletModule,
        BullModule.registerQueue({
            name: APP_BULL_QUEUES.EMAIL,
        }),
        ActivityLogModule,
        CommonFileModule,
    ],
    controllers: [
        UserAdminController,
        UserPublicController,
        UserTeamController,
    ],
    providers: [UserService, UserTeamService],
    exports: [UserService, UserTeamService],
})
export class UserModule {}
