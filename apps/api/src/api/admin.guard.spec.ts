import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function ctx(agent: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ agent }) }),
  } as any;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows admins', () => {
    expect(guard.canActivate(ctx({ id: 'a1', role: 'admin' }))).toBe(true);
  });

  it('rejects non-admins', () => {
    expect(() => guard.canActivate(ctx({ id: 'a2', role: 'supervisor' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects unauthenticated requests', () => {
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });
});
