import { registerAs } from '@nestjs/config';

/**
 * Supabase configuration (Storage uses service role on the server).
 *
 * Environment variables:
 * - SUPABASE_URL: Project URL (https://xxx.supabase.co)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (server-side only)
 * - SUPABASE_STORAGE_BUCKET_USER_UPLOADS: Bucket for user uploads / presigned PUT (required for FileService)
 * - SUPABASE_STORAGE_BUCKET_PUBLIC_ASSETS: Optional public bucket for static marketing/branding assets
 * - SUPABASE_STORAGE_PRESIGN_EXPIRES: Requested presign TTL in seconds (default: 3600; signed upload URLs are capped at 2 hours by Supabase)
 */
export default registerAs(
    'supabase',
    (): Record<string, unknown> => ({
        url: process.env.SUPABASE_URL,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        storage: {
            userUploadsBucket: process.env.SUPABASE_STORAGE_BUCKET_USER_UPLOADS,
            publicAssetsBucket:
                process.env.SUPABASE_STORAGE_BUCKET_PUBLIC_ASSETS,
            presignExpires:
                Number(process.env.SUPABASE_STORAGE_PRESIGN_EXPIRES) || 3600,
        },
    })
);
