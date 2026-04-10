import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { registerAs } from '@nestjs/config';

import { APP_ENVIRONMENT } from 'src/app/enums/app.enum';

export default registerAs('app', (): Record<string, any> => {
    const rawOrigins = process.env.APP_CORS_ORIGINS
        ? process.env.APP_CORS_ORIGINS.split(',').map(origin => origin.trim())
        : [];

    // `credentials: true` is incompatible with wildcard origin '*'.
    // When APP_CORS_ORIGINS is '*' or unset, reflect the request Origin back (allows all
    // origins while still supporting credentialed requests in development).
    const isWildcard =
        rawOrigins.length === 0 ||
        (rawOrigins.length === 1 && rawOrigins[0] === '*');
    const corsOrigin: CorsOptions['origin'] = isWildcard ? true : rawOrigins;

    const corsConfig: CorsOptions = {
        origin: corsOrigin,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
    };

    return {
        env: process.env.APP_ENV ?? APP_ENVIRONMENT.LOCAL,
        name: process.env.APP_NAME ?? 'jinx.to',

        versioning: {
            enable: process.env.HTTP_VERSIONING_ENABLE === 'true',
            prefix: 'v',
            version: process.env.HTTP_VERSION ?? '1',
        },

        throttle: {
            ttl: 60,
            limit: 10,
        },

        http: {
            host: process.env.HTTP_HOST ?? '0.0.0.0',
            port: process.env.PORT
                ? Number.parseInt(process.env.PORT)
                : process.env.HTTP_PORT
                  ? Number.parseInt(process.env.HTTP_PORT)
                  : 3000,
        },

        cors: corsConfig,

        sentry: {
            dsn: process.env.SENTRY_DSN,
            environment: process.env.APP_ENV ?? APP_ENVIRONMENT.LOCAL,
        },

        debug: process.env.APP_DEBUG === 'true',
        logLevel: process.env.APP_LOG_LEVEL ?? 'info',
    };
});
