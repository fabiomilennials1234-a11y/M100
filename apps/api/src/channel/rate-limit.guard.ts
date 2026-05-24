import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limit: number;

  constructor(private readonly redis: any) {
    this.limit = parseInt(process.env.RATE_LIMIT_PER_MINUTE ?? '30', 10);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const remoteJid = request.body?.data?.key?.remoteJid;

    if (!remoteJid) return true;

    const phone = remoteJid.replace('@s.whatsapp.net', '');
    const key = `ratelimit:${phone}`;

    const count = await this.redis.incr(key);

    const ttl = await this.redis.ttl(key);
    if (ttl === -1) {
      await this.redis.expire(key, 60);
    }

    if (count >= this.limit) {
      throw new HttpException(
        `Rate limit exceeded for ${phone}. Max ${this.limit} messages/minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
