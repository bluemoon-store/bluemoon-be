export type DropStatus = 'live' | 'expired' | 'exhausted' | 'inactive';

export function deriveDropStatus(input: {
    isActive: boolean;
    expiresAt: Date | null;
    quantity: number;
    claimedCount: number;
}): DropStatus {
    if (!input.isActive) {
        return 'inactive';
    }
    if (input.claimedCount >= input.quantity) {
        return 'exhausted';
    }
    if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
        return 'expired';
    }
    return 'live';
}

export function daysRemaining(expiresAt: Date | null): number | null {
    if (!expiresAt) {
        return null;
    }

    const diffMs = expiresAt.getTime() - Date.now();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
}

export function isUserAllowed(
    allowedEmails: string[],
    userEmail: string
): boolean {
    if (!allowedEmails.length) {
        return true;
    }
    return allowedEmails.some(
        email => email.trim().toLowerCase() === userEmail.trim().toLowerCase()
    );
}
