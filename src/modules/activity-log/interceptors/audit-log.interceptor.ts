import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bull';
import { ActivityLogSeverity, ActivityLogStatus } from '@prisma/client';
import { JobOptions, Queue } from 'bull';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import {
    AUDIT_LOG_METADATA_KEY,
    AUDIT_LOG_REDACT_KEYS,
} from '../constants/audit-log.constants';
import { AuditLogOptions } from '../decorators/audit-log.decorator';
import { IActivityLogJobPayload } from '../interfaces/activity-log-job.interface';
import { ActivityLogEmitterService } from '../services/activity-log.emitter.service';
import { ActivityLogService } from '../services/activity-log.service';

function getByPath(obj: unknown, path: string): unknown {
    const parts = path.split('.').filter(Boolean);
    let cur: unknown = obj;
    for (const p of parts) {
        if (cur === null || typeof cur !== 'object') {
            return undefined;
        }
        cur = (cur as Record<string, unknown>)[p];
    }
    return cur;
}

function redactDeep(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(redactDeep);
    }
    if (typeof value !== 'object') {
        return value;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (AUDIT_LOG_REDACT_KEYS.has(k)) {
            out[k] = '[REDACTED]';
        } else {
            out[k] = redactDeep(v);
        }
    }
    return out;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditLogInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        @InjectQueue(APP_BULL_QUEUES.ACTIVITY_LOG)
        private readonly activityLogQueue: Queue<IActivityLogJobPayload>,
        private readonly activityLogService: ActivityLogService,
        private readonly activityLogEmitter: ActivityLogEmitterService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(AuditLogInterceptor.name);
    }

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        const meta = this.reflector.get<AuditLogOptions | undefined>(
            AUDIT_LOG_METADATA_KEY,
            context.getHandler()
        );

        if (!meta) {
            return next.handle();
        }

        const req = context.switchToHttp().getRequest<
            Request & {
                user?: IAuthUser;
                body?: unknown;
                params?: Record<string, string>;
                id?: string;
            }
        >();

        return next.handle().pipe(
            tap(responseBody => {
                void this.enqueue(req, meta, null, responseBody);
            }),
            catchError(err => {
                void this.enqueue(req, meta, err, undefined);
                return throwError(() => err);
            })
        );
    }

    private async enqueue(
        req: Request & {
            user?: IAuthUser;
            body?: unknown;
            params?: Record<string, string>;
            id?: string;
        },
        meta: AuditLogOptions,
        error: unknown | null,
        responseBody?: unknown
    ): Promise<void> {
        const diff = this.activityLogEmitter.consumeDiff();
        const resourceParam = meta.resourceIdParam ?? 'id';
        const params = req.params ?? {};
        let resourceId = params[resourceParam] ?? params.id ?? null;

        if (
            meta.resourceIdResponsePath &&
            responseBody !== undefined &&
            error === null
        ) {
            const extracted = getByPath(
                responseBody,
                meta.resourceIdResponsePath
            );
            if (typeof extracted === 'string' && extracted.length > 0) {
                resourceId = extracted;
            }
        }

        if (!resourceId) {
            resourceId = this.activityLogEmitter.takeAuditResourceId() ?? null;
        }

        const metadata: Record<string, unknown> = {
            method: req.method,
            path:
                'originalUrl' in req && typeof req.originalUrl === 'string'
                    ? req.originalUrl.split('?')[0]
                    : req.url?.split('?')[0],
            body: redactDeep(req.body),
        };

        const payload: IActivityLogJobPayload = {
            action: meta.action,
            category: meta.category,
            severity: meta.severity ?? ActivityLogSeverity.INFO,
            resourceType: meta.resourceType ?? null,
            resourceId,
            resourceLabel: diff.resourceLabel ?? null,
            before: diff.before,
            after: diff.after,
            metadata,
            actorId: req.user?.userId ?? null,
            actorRoleFromToken: req.user?.role ?? null,
            ipAddress: this.clientIp(req),
            userAgent: this.sliceUa(req.headers['user-agent']),
            requestId: this.requestId(req),
            status: error
                ? ActivityLogStatus.FAILURE
                : ActivityLogStatus.SUCCESS,
            errorMessage: error
                ? error instanceof Error
                    ? error.message
                    : String(error)
                : null,
        };

        const jobOpts: JobOptions = {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
        };

        try {
            await this.activityLogQueue.add('persist', payload, jobOpts);
        } catch (queueErr: any) {
            this.logger.warn(
                {
                    err: queueErr?.message ?? queueErr,
                    action: payload.action,
                },
                'Audit log queue unavailable; persisting synchronously'
            );
            await this.activityLogService.persistDirect(payload);
        }
    }

    private clientIp(req: Request): string | null {
        const xf = req.headers['x-forwarded-for'];
        const first =
            typeof xf === 'string'
                ? xf.split(',')[0]?.trim()
                : Array.isArray(xf)
                  ? xf[0]
                  : null;
        return first || req.ip || null;
    }

    private sliceUa(ua: string | string[] | undefined): string | null {
        const raw = Array.isArray(ua) ? ua[0] : ua;
        if (!raw) {
            return null;
        }
        return raw.length > 512 ? raw.slice(0, 512) : raw;
    }

    private requestId(req: Request & { id?: string }): string | null {
        if (req.id) {
            return String(req.id);
        }
        const h = req.headers['x-request-id'];
        return typeof h === 'string' ? h : null;
    }
}
