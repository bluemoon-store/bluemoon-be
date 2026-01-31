/**
 * Order utility functions
 */

export function generateOrderNumberString(date: Date = new Date()): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
}
