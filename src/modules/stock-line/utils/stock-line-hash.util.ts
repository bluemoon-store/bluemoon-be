import { createHash } from 'crypto';

/** SHA-256 of UTF-8 trimmed content (dedupe key). */
export function hashStockLineContent(raw: string): string {
    const trimmed = raw.trim();
    return createHash('sha256').update(trimmed, 'utf8').digest('hex');
}
