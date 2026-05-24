import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Activity, Inbox, Bot, User, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Metrics {
  active: number;
  queued: number;
  aiHandled: number;
  humanHandled: number;
  closedToday: number;
}

const cards: Array<{ key: keyof Metrics; label: string; icon: LucideIcon; color: string }> = [
  { key: 'active', label: 'Ativas', icon: Activity, color: 'text-blue-400' },
  { key: 'queued', label: 'Na fila', icon: Inbox, color: 'text-amber-400' },
  { key: 'aiHandled', label: 'IA', icon: Bot, color: 'text-emerald-400' },
  { key: 'humanHandled', label: 'Humano', icon: User, color: 'text-purple-400' },
  { key: 'closedToday', label: 'Encerradas hoje', icon: CheckCircle, color: 'text-zinc-400' },
];

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div data-testid="metric-skeleton" className="animate-pulse rounded-lg border border-border bg-card p-4">
      <div className="h-4 w-20 rounded bg-muted" />
      <div className="mt-3 h-7 w-12 rounded bg-muted" />
    </div>
  );
}

export function DashboardPage() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await apiFetch('/api/metrics', token);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {isLoading
          ? cards.map((c) => <MetricSkeleton key={c.key} />)
          : cards.map((c) => (
              <MetricCard key={c.key} label={c.label} value={data?.[c.key] ?? 0} icon={c.icon} color={c.color} />
            ))}
      </div>
    </div>
  );
}
