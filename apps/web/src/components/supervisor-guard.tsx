import { useAuth } from '@/hooks/use-auth';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

const ALLOWED_ROLES = ['supervisor', 'admin'];

export function SupervisorGuard({ children, fallback = null }: Props) {
  const { agent } = useAuth();

  if (!agent || !ALLOWED_ROLES.includes(agent.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
