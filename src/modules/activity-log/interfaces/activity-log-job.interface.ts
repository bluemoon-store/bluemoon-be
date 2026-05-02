import {
    ActivityLogCategory,
    ActivityLogSeverity,
    ActivityLogStatus,
    Role,
} from '@prisma/client';

export interface IActivityLogJobPayload {
    action: string;
    category: ActivityLogCategory;
    severity: ActivityLogSeverity;
    resourceType?: string | null;
    resourceId?: string | null;
    resourceLabel?: string | null;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    actorId?: string | null;
    actorRoleFromToken?: Role | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    status: ActivityLogStatus;
    errorMessage?: string | null;
}
