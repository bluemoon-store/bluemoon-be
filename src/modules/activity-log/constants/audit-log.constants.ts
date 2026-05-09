export const AUDIT_LOG_METADATA_KEY = 'audit_log';

/** Plain paths / keys aligned with Logger redaction policy */
export const AUDIT_LOG_REDACT_KEYS = new Set([
    'generatedPassword',
    'password',
    'passwordConfirmation',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'twoFactorSecret',
    'token',
    'accessToken',
    'refreshToken',
    'cardNumber',
    'cvv',
]);
