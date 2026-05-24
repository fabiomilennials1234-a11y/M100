import { Test } from '@nestjs/testing';
import { RateLimitGuard, REDIS_CLIENT } from './rate-limit.guard';
import { ExecutionContext, HttpException } from '@nestjs/common';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(-1),
    };

    const module = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    guard = module.get(RateLimitGuard);
  });

  function createContext(phone: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body: {
            event: 'messages.upsert',
            data: {
              key: { remoteJid: `${phone.replace('+', '')}@s.whatsapp.net` },
            },
          },
        }),
        getResponse: () => ({
          setHeader: jest.fn(),
        }),
      }),
    } as any;
  }

  it('allows requests under limit', async () => {
    mockRedis.incr.mockResolvedValue(1);
    const result = await guard.canActivate(createContext('+5511999990000'));
    expect(result).toBe(true);
  });

  it('blocks requests at limit', async () => {
    mockRedis.incr.mockResolvedValue(30);
    await expect(guard.canActivate(createContext('+5511999990000'))).rejects.toThrow(HttpException);
  });

  it('blocks requests above limit', async () => {
    mockRedis.incr.mockResolvedValue(31);
    await expect(guard.canActivate(createContext('+5511999990000'))).rejects.toThrow(HttpException);
  });

  it('sets TTL on first request', async () => {
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.ttl.mockResolvedValue(-1);

    await guard.canActivate(createContext('+5511999990000'));

    expect(mockRedis.expire).toHaveBeenCalledWith(
      'ratelimit:5511999990000',
      60,
    );
  });

  it('does not reset TTL on subsequent requests', async () => {
    mockRedis.incr.mockResolvedValue(5);
    mockRedis.ttl.mockResolvedValue(45);

    await guard.canActivate(createContext('+5511999990000'));

    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('tracks phones independently', async () => {
    mockRedis.incr
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    mockRedis.ttl.mockResolvedValue(-1);

    await guard.canActivate(createContext('+5511111111111'));
    await guard.canActivate(createContext('+5522222222222'));

    expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:5511111111111');
    expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:5522222222222');
  });

  it('returns 429 with descriptive message', async () => {
    mockRedis.incr.mockResolvedValue(30);

    try {
      await guard.canActivate(createContext('+5511999990000'));
      fail('should have thrown');
    } catch (error: any) {
      expect(error.getStatus()).toBe(429);
    }
  });
});
