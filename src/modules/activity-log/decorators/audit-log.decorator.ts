import { SetMetadata } from '@nestjs/common';
import { ActivityLogCategory, ActivityLogSeverity } from '@prisma/client';

import { AUDIT_LOG_METADATA_KEY } from '../constants/audit-log.constants';

export interface AuditLogOptions {
    action: string;
    category: ActivityLogCategory;
    resourceType?: string;
    resourceIdParam?: string;
    severity?: ActivityLogSeverity;
}

export const AuditLog = (options: AuditLogOptions) =>
    SetMetadata(AUDIT_LOG_METADATA_KEY, options);
