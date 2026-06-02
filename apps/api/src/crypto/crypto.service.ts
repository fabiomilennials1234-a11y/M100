import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit nonce, recommended for GCM
const KEY_BYTES = 32; // 256-bit key

/**
 * Symmetric encryption for credentials at rest (e.g. UAZAPI instance tokens).
 *
 * Deep module: tiny interface (encrypt/decrypt), all AES-256-GCM mechanics —
 * key parsing, random IV per call, auth-tag handling, envelope format — hidden.
 * Ciphertext envelope: base64(iv).base64(authTag).base64(payload).
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const raw = config.get<string>('ENCRYPTION_KEY');
    if (!raw) {
      throw new Error('ENCRYPTION_KEY is required (64 hex chars = 32 bytes)');
    }
    const key = Buffer.from(raw, 'hex');
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length})`,
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const payload = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      payload.toString('base64'),
    ].join('.');
  }

  decrypt(ciphertext: string): string {
    const [ivB64, tagB64, payloadB64] = ciphertext.split('.');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const payload = Buffer.from(payloadB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(payload),
      decipher.final(),
    ]).toString('utf8');
  }
}
