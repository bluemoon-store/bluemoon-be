export function auditValuesEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
        return true;
    }
    if (a === null || b === null || a === undefined || b === undefined) {
        return a === b;
    }
    if (typeof a === 'object' && typeof b === 'object') {
        try {
            return JSON.stringify(a) === JSON.stringify(b);
        } catch {
            return false;
        }
    }
    return false;
}

/**
 * Symmetric diff: only keys whose values differ appear in before and/or after.
 */
export function symmetricFieldDiff(
    before?: Record<string, unknown> | null,
    after?: Record<string, unknown> | null
): {
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
} {
    const keys = new Set([
        ...Object.keys(before ?? {}),
        ...Object.keys(after ?? {}),
    ]);
    const b: Record<string, unknown> = {};
    const a: Record<string, unknown> = {};
    for (const k of keys) {
        const bv = before?.[k];
        const av = after?.[k];
        if (!auditValuesEqual(bv, av)) {
            if (bv !== undefined) {
                b[k] = bv;
            }
            if (av !== undefined) {
                a[k] = av;
            }
        }
    }
    return {
        before: Object.keys(b).length ? b : null,
        after: Object.keys(a).length ? a : null,
    };
}
