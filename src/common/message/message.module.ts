import { join } from 'path';

import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';

import { MessageService } from './services/message.service';

@Module({
    imports: [
        I18nModule.forRoot({
            fallbackLanguage: 'en',
            loaderOptions: {
                path: join(__dirname, '../../languages/'),
                watch: true,
            },
            resolvers: [AcceptLanguageResolver],
        }),
    ],
    exports: [MessageService],
    providers: [MessageService],
})
export class MessageModule {}
