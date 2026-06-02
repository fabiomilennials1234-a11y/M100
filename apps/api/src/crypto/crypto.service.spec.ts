import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

// 32-byte key (256-bit) as 64 hex chars
const VALID_KEY = '0'.repeat(64);

function makeService(key: string | undefined = VALID_KEY): CryptoService {
  const config = {
    get: (name: string) => (name === 'ENCRYPTION_KEY' ? key : undefined),
  } as unknown as ConfigService;
  return new CryptoService(config);
}

describe('CryptoService', () => {
  it('decrypts what it encrypted, recovering the original plaintext', () => {
    const crypto = makeService();
    const plaintext = 'uazapi-instance-token-secret';

    const ciphertext = crypto.encrypt(plaintext);

    expect(crypto.decrypt(ciphertext)).toBe(plaintext);
  });

  it('produces different ciphertext each call for the same plaintext (random IV)', () => {
    const crypto = makeService();
    const plaintext = 'same-secret';

    const a = crypto.encrypt(plaintext);
    const b = crypto.encrypt(plaintext);

    expect(a).not.toBe(b);
    expect(crypto.decrypt(a)).toBe(plaintext);
    expect(crypto.decrypt(b)).toBe(plaintext);
  });

  it('rejects tampered ciphertext instead of returning garbage (GCM auth)', () => {
    const crypto = makeService();
    const ciphertext = crypto.encrypt('do-not-touch');
    const [iv, tag, payload] = ciphertext.split('.');
    const flipped = Buffer.from(payload, 'base64');
    flipped[0] ^= 0xff;
    const tampered = [iv, tag, flipped.toString('base64')].join('.');

    expect(() => crypto.decrypt(tampered)).toThrow();
  });

  it('refuses to start when ENCRYPTION_KEY is missing', () => {
    expect(() => makeService('')).toThrow(/ENCRYPTION_KEY/);
  });

  it('refuses to start when ENCRYPTION_KEY is not 32 bytes', () => {
    expect(() => makeService('abcd')).toThrow(/32 bytes/);
  });
});
