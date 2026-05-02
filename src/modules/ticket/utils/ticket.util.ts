/** Format: TKT-YYYYMMDD-NNNNN (numeric suffix) */
export function generateTicketNumberString(date: Date = new Date()): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const n = Math.floor(10000 + Math.random() * 90000);
    return `TKT-${dateStr}-${n}`;
}
