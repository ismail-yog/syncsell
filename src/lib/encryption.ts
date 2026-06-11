import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Retrieves the 32-byte encryption key from the environment.
 * ENCRYPTION_KEY must be a 64-character hex string.
 *
 * @returns The encryption key as a Buffer
 * @throws Error if ENCRYPTION_KEY is not set or has incorrect length
 */
function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  if (keyHex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated string of iv:ciphertext:authTag (all hex encoded).
 *
 * @param plaintext - The string to encrypt
 * @returns The encrypted string in the format "iv:ciphertext:authTag"
 * @throws Error if encryption fails or ENCRYPTION_KEY is invalid
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${ciphertext}:${authTag.toString('hex')}`;
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
      throw error;
    }
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypts a string previously encrypted with the encrypt() function.
 * Expects the input in the format "iv:ciphertext:authTag" (all hex encoded).
 *
 * @param encrypted - The encrypted string in "iv:ciphertext:authTag" format
 * @returns The decrypted plaintext string
 * @throws Error if decryption fails, format is invalid, or authentication fails
 */
export function decrypt(encrypted: string): string {
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted data format. Expected "iv:ciphertext:authTag"'
      );
    }

    const [ivHex, ciphertext, authTagHex] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`
      );
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('ENCRYPTION_KEY') ||
        error.message.includes('Invalid'))
    ) {
      throw error;
    }
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
