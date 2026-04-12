export interface IStorageService {
    /**
     * Generate a presigned URL for uploading an object
     * @param key - Object path/key within the bucket
     * @param contentType - MIME type of the file
     * @param expiresIn - Optional expiration time in seconds
     */
    getPresignedUploadUrl(
        key: string,
        contentType: string,
        expiresIn?: number
    ): Promise<{ url: string; expiresIn: number }>;

    /**
     * Upload an object from the server
     * @param key - Object path/key within the bucket
     * @param body - File content
     * @param contentType - MIME type of the file
     */
    uploadObject(
        key: string,
        body: Buffer | string,
        contentType: string
    ): Promise<void>;

    /**
     * Public URL for an object (bucket must be public, or URL is still the public path pattern)
     * @param key - Object path/key within the bucket
     */
    getPublicUrl(key: string): string;
}
