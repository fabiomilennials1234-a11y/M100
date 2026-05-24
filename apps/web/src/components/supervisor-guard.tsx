import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

const ELEVATED_ROLES = new Set(['supervisor', 'admin']);

export function SupervisorGuard({ children, fallback = null }: Props) {
  const { agent } = useAuth();

  if (!agent || !ELEVATED_ROLES.has(agent.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
