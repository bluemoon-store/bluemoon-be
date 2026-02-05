import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import compression from 'compression';
import express from 'express';
import { Logger } from 'nestjs-pino';
import { getQueueToken } from '@nestjs/bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter as BullBoardExpressAdapter } from '@bull-board/express';

import { AppModule } from './app/app.module';
import { APP_ENVIRONMENT, APP_BULL_QUEUES } from './app/enums/app.enum';
import setupSwagger from './swagger';

async function bootstrap(): Promise<void> {
    const server = express();
    let app: any;

    try {
        // Create app
        app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
            bufferLogs: true,
        });

        const config = app.get(ConfigService);
        const logger = app.get(Logger);
        const env = config.get('app.env');
        const host = config.getOrThrow('app.http.host');
        const port = config.getOrThrow('app.http.port');

        // Bull Board - Queue dashboard (non-production only)
        if (env !== APP_ENVIRONMENT.PRODUCTION) {
            const serverAdapter = new BullBoardExpressAdapter();
            serverAdapter.setBasePath('/admin/queues');

            // Register all queues for monitoring
            const queues = [
                // Crypto Payment Queues
                app.get(getQueueToken('crypto-payment-verification')),
                app.get(getQueueToken('crypto-payment-forwarding')),
                // Email & Notification Queues
                app.get(getQueueToken(APP_BULL_QUEUES.EMAIL)),
                app.get(getQueueToken(APP_BULL_QUEUES.NOTIFICATION)),
            ];

            createBullBoard({
                queues: queues.map(queue => new BullAdapter(queue)),
                serverAdapter,
            });

            app.use('/admin/queues', serverAdapter.getRouter());
            logger.log('Bull Board available at /admin/queues');
            logger.log(
                `Registered ${queues.length} queues: crypto-payment-verification, crypto-payment-forwarding, ${APP_BULL_QUEUES.EMAIL}, ${APP_BULL_QUEUES.NOTIFICATION}`
            );
        }

        // Middleware
        app.use(compression());
        app.useLogger(logger);
        app.enableCors(config.get('app.cors'));

        // Global settings
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            })
        );

        // Enable versioning
        app.enableVersioning({
            type: VersioningType.URI,
            defaultVersion: '1',
        });

        useContainer(app.select(AppModule), { fallbackOnErrors: true });

        // Swagger for non-production
        if (env !== APP_ENVIRONMENT.PRODUCTION) {
            setupSwagger(app);
        }

        // Graceful shutdown (only in production - watch mode handles this differently)
        if (env === APP_ENVIRONMENT.PRODUCTION) {
            const gracefulShutdown = async (signal: string) => {
                logger.log(`Received ${signal}, shutting down gracefully...`);
                await app.close();
                process.exit(0);
            };

            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        } else {
            // In development, enable shutdown hooks for proper cleanup
            app.enableShutdownHooks();
        }

        // Start server
        await app.listen(port, host);

        const appUrl = await app.getUrl();
        logger.log(`Server running on: ${appUrl}`);
    } catch (error) {
        console.error('Server failed to start:', error);
        if (app) await app.close();
        process.exit(1);
    }
}

bootstrap();
