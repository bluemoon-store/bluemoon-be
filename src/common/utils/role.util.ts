/**
 * Process role helpers.
 *
 * Production runs two containers from the same image:
 *   - APP_ROLE=api    → serves HTTP, no Bull processors, no @Cron handlers
 *   - APP_ROLE=worker → consumes Bull queues + runs schedulers, no HTTP
 *
 * In local dev APP_ROLE is unset; we treat that as a single-process mode where
 * processors and schedulers run alongside the HTTP server (current behavior).
 */
const role = (process.env.APP_ROLE || '').toLowerCase();

export const isWorkerProcess = (): boolean => role === 'worker' || role === '';

/** Returns the given providers only when this process should run workers. */
export const workerOnlyProviders = <T>(providers: T[]): T[] =>
    isWorkerProcess() ? providers : [];
