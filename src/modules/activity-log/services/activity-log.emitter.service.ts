import { Injectable, Scope } from '@nestjs/common';

import { symmetricFieldDiff } from '../utils/audit-diff.util';

/**
 * Request-scoped store for before/after snapshots for admin mutations.
 * Pairs with {@link AuditLogInterceptor} to merge symmetric diffs into the audit row.
 */
@Injectable({ scope: Scope.REQUEST })
export class ActivityLogEmitterService {
    private partialBefore: Record<string, unknown> = {};

    private partialAfter: Record<string, unknown> = {};

    private resourceLabel?: string;

    captureBefore(payload: { before: Record<string, unknown> }): void {
        this.partialBefore = { ...this.partialBefore, ...payload.before };
    }

    captureAfter(payload: {
        after: Record<string, unknown>;
        resourceLabel?: string;
    }): void {
        this.partialAfter = { ...this.partialAfter, ...payload.after };
        if (payload.resourceLabel !== undefined) {
            this.resourceLabel = payload.resourceLabel;
        }
    }

    consumeDiff(): {
        before: Record<string, unknown> | null;
        after: Record<string, unknown> | null;
        resourceLabel?: string;
    } {
        const { before, after } = symmetricFieldDiff(
            Object.keys(this.partialBefore).length ? this.partialBefore : null,
            Object.keys(this.partialAfter).length ? this.partialAfter : null
        );
        this.partialBefore = {};
        this.partialAfter = {};
        const label = this.resourceLabel;
        this.resourceLabel = undefined;
        return { before, after, resourceLabel: label };
    }
}
