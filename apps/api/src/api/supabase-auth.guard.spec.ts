import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;
  let mockPrisma: any;
  let mockSupabase: any;

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';
    mockPrisma = {
      agent: {
        findUnique: jest.fn(),
      },
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };

    guard = new SupabaseAuthGuard(mockPrisma as PrismaService);
    (guard as any).supabase = mockSupabase;
  });

  const mockContext = (headers: Record<string, string> = {}) => {
    const request = { headers, agent: undefined };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('rejects request with missing Authorization header', async () => {
    await expect(guard.canActivate(mockContext())).rejects.toThrow(UnauthorizedException);
  });

  it('rejects request with invalid token', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer invalid-token' })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('passes valid token and attaches agent to request', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { email: 'agent@motor100.com' } },
      error: null,
    });

    mockPrisma.agent.findUnique.mockResolvedValue({
      id: 'agent-1',
      name: 'João',
      email: 'agent@motor100.com',
      role: 'attendant',
    });

    const ctx = mockContext({ authorization: 'Bearer valid-token' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.agent).toEqual(expect.objectContaining({
      id: 'agent-1',
      role: 'attendant',
    }));
  });
});
