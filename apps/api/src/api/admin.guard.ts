import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Authorizes admin-only routes. Runs AFTER SupabaseAuthGuard, which populates
 * `request.agent`. Channel/instance management is admin-only.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.agent?.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
