import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Manages the Flex Smart auth session: logs in via /login, caches the
 * access_token, and re-logs in when the token expires or is invalidated (401).
 * Deep module — the rest of the integration just calls getToken().
 *
 * No refresh endpoint is documented, so renewal == re-login. expires_at comes
 * as a textual date with timezone (e.g. "Sun Nov 24 12:10:11 BRT 2019"); when
 * it can't be parsed reliably we fall back to a conservative TTL.
 */
const FALLBACK_TTL_MS = 30 * 60 * 1000;
const SKEW_MS = 60 * 1000;

@Injectable()
export class FlexAuthSession {
  private readonly logger = new Logger(FlexAuthSession.name);
  private cached: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) {
      return this.cached.token;
    }
    return this.login();
  }

  /** Drops the cached token so the next getToken() re-authenticates (e.g. on 401). */
  invalidate(): void {
    this.cached = null;
  }

  private async login(): Promise<string> {
    const baseUrl = this.config.get<string>('FLEX_BASE_URL') ?? '';
    const username = this.config.get<string>('FLEX_USERNAME') ?? '';
    const password = this.config.get<string>('FLEX_PASSWORD') ?? '';

    const { data } = await axios.post(
      `${baseUrl}/login`,
      { username, password },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const token: string = data.access_token;
    this.cached = {
      token,
      expiresAt: this.parseExpiry(data.expires_at),
    };
    return token;
  }

  private parseExpiry(expiresAt: unknown): number {
    if (typeof expiresAt === 'string') {
      const parsed = Date.parse(expiresAt);
      if (!Number.isNaN(parsed) && parsed > Date.now()) {
        return parsed - SKEW_MS;
      }
    }
    return Date.now() + FALLBACK_TTL_MS;
  }
}
