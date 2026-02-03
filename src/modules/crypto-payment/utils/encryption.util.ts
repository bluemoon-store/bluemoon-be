import * as crypto from 'crypto';

/**
 * Encryption configuration constants
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits (96 bits recommended for GCM)
const SALT_LENGTH = 16;
const TAG_LENGTH = 16; // Authentication tag length for GCM (must match cipher/decipher options)
const ITERATIONS = 100000; // PBKDF2 iterations

export interface EncryptedData {
    encrypted: string; // Base64 encoded encrypted data
    iv: string; // Base64 encoded initialization vector
    salt: string; // Base64 encoded salt
    tag: string; // Base64 encoded authentication tag
}

/**
 * Derive encryption key from master key using PBKDF2
 * @param masterKey - Master encryption key (from environment)
 * @param salt - Random salt
 * @returns Derived key buffer
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt private key using AES-256-GCM
 * @param privateKey - Private key in hex format
 * @param masterKey - Master encryption key
 * @returns Encrypted data with IV, salt, and tag
 */
export function encryptPrivateKey(
    privateKey: string,
    masterKey: string
): EncryptedData {
    if (!masterKey || masterKey.length < 32) {
        throw new Error(
            'Master encryption key must be at least 32 bytes. Generate with: openssl rand -base64 32'
        );
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive encryption key from master key
    const key = deriveKey(masterKey, salt);

    // Create cipher with explicit auth tag length (GCM defaults to 16 bytes)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: TAG_LENGTH,
    });

    // Encrypt private key
    let encrypted = cipher.update(privateKey, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get authentication tag (length will be TAG_LENGTH)
    const tag = cipher.getAuthTag();

    // Return encrypted data with metadata
    return {
        encrypted: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        salt: salt.toString('base64'),
        tag: tag.toString('base64'),
    };
}

/**
 * Decrypt private key using AES-256-GCM
 * @param encryptedData - Encrypted data with IV, salt, and tag
 * @param masterKey - Master encryption key
 * @returns Decrypted private key in hex format
 */
export function decryptPrivateKey(
    encryptedData: EncryptedData,
    masterKey: string
): string {
    if (!masterKey || masterKey.length < 32) {
        throw new Error(
            'Master encryption key must be at least 32 bytes. Generate with: openssl rand -base64 32'
        );
    }

    try {
        // Decode base64 strings
        const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
        const iv = Buffer.from(encryptedData.iv, 'base64');
        const salt = Buffer.from(encryptedData.salt, 'base64');
        const tag = Buffer.from(encryptedData.tag, 'base64');

        // Validate auth tag length (prevents tampering or wrong algorithm)
        if (tag.length !== TAG_LENGTH) {
            throw new Error(
                `Invalid authentication tag length: expected ${TAG_LENGTH} bytes, got ${tag.length}`
            );
        }

        // Derive decryption key from master key
        const key = deriveKey(masterKey, salt);

        // Create decipher with same auth tag length as cipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
            authTagLength: TAG_LENGTH,
        });
        decipher.setAuthTag(tag);

        // Decrypt private key
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    } catch (error) {
        throw new Error(
            `Failed to decrypt private key: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Serialize encrypted data to JSON string for database storage
 * @param encryptedData - Encrypted data object
 * @returns JSON string
 */
export function serializeEncryptedData(encryptedData: EncryptedData): string {
    return JSON.stringify(encryptedData);
}

/**
 * Deserialize encrypted data from JSON string
 * @param jsonString - JSON string from database
 * @returns Encrypted data object
 */
export function deserializeEncryptedData(jsonString: string): EncryptedData {
    try {
        const parsed = JSON.parse(jsonString);

        // Validate structure
        if (!parsed.encrypted || !parsed.iv || !parsed.salt || !parsed.tag) {
            throw new Error('Invalid encrypted data structure');
        }

        return parsed as EncryptedData;
    } catch (error) {
        throw new Error(
            `Failed to deserialize encrypted data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Encrypt and serialize private key for database storage
 * @param privateKey - Private key in hex format
 * @param masterKey - Master encryption key
 * @returns JSON string ready for database storage
 */
export function encryptAndSerialize(
    privateKey: string,
    masterKey: string
): string {
    const encrypted = encryptPrivateKey(privateKey, masterKey);
    return serializeEncryptedData(encrypted);
}

/**
 * Deserialize and decrypt private key from database
 * @param encryptedJson - JSON string from database
 * @param masterKey - Master encryption key
 * @returns Decrypted private key in hex format
 */
export function deserializeAndDecrypt(
    encryptedJson: string,
    masterKey: string
): string {
    const encryptedData = deserializeEncryptedData(encryptedJson);
    return decryptPrivateKey(encryptedData, masterKey);
}

/**
 * Generate a secure random encryption key
 * @returns Base64 encoded key (32 bytes)
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

/**
 * Validate encryption key format
 * @param key - Encryption key to validate
 * @returns True if valid
 */
export function isValidEncryptionKey(key: string): boolean {
    try {
        const decoded = Buffer.from(key, 'base64');
        return decoded.length >= KEY_LENGTH;
    } catch {
        return false;
    }
}
