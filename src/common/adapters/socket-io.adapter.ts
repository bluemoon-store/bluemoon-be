import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ServerOptions } from 'socket.io';

/**
 * Applies the same CORS policy as HTTP (`app.cors`) to the Socket.IO engine.
 */
export class CorsIoAdapter extends IoAdapter {
    constructor(
        app: INestApplication,
        private readonly cors: CorsOptions
    ) {
        super(app);
    }

    createIOServer(
        port: number,
        options?: ServerOptions
    ): ReturnType<IoAdapter['createIOServer']> {
        const merged: ServerOptions = {
            ...options,
            cors: this.cors as ServerOptions['cors'],
        };
        return super.createIOServer(port, merged);
    }
}
