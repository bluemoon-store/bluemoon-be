const CODE_REGEX = /^[A-Z0-9-]+$/;

export function normalizeCode(code: string): string {
    return code.trim().toUpperCase();
}

export function isValidCodeFormat(normalized: string): boolean {
    return (
        normalized.length >= 3 &&
        normalized.length <= 32 &&
        CODE_REGEX.test(normalized)
    );
}

/**
 * List/badge status is derived from expiry only (not isActive).
 */
export function deriveStatus(expiresAt: Date | null): 'active' | 'expired' {
    if (!expiresAt) {
        return 'active';
    }
    return expiresAt.getTime() > Date.now() ? 'active' : 'expired';
}

/**
 * Full days until end of expiry day in UTC-approximation; null = never expires.
 */
export function daysRemaining(expiresAt: Date | null): number | null {
    if (!expiresAt) {
        return null;
    }
    const diffMs = expiresAt.getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
}
