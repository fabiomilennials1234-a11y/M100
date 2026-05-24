import { useQuery } from '@tanstack/react-query';
import { Activity, Inbox, Bot, User, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';

interface Metrics {
  active: number;
  queued: number;
  aiHandled: number;
  humanHandled: number;
  closedToday: number;
}

const chartData = [
  { hour: '08h', conversations: 12 },
  { hour: '09h', conversations: 28 },
  { hour: '10h', conversations: 45 },
  { hour: '11h', conversations: 38 },
  { hour: '12h', conversations: 22 },
  { hour: '13h', conversations: 30 },
  { hour: '14h', conversations: 52 },
  { hour: '15h', conversations: 48 },
  { hour: '16h', conversations: 35 },
  { hour: '17h', conversations: 20 },
];

export function DashboardPage() {
  const { token } = useAuth();

  const { data: metrics, isLoading } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await apiFetch('/api/metrics', token!);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: 30_000,
    enabled: !!token,
  });

  const cards = [
    { label: 'Ativas', value: metrics?.active, icon: Activity, color: 'text-blue-400' },
    { label: 'Na fila', value: metrics?.queued, icon: Inbox, color: 'text-warning' },
    { label: 'IA', value: metrics?.aiHandled, icon: Bot, color: 'text-success' },
    { label: 'Humano', value: metrics?.humanHandled, icon: User, color: 'text-purple-400' },
    { label: 'Encerradas hoje', value: metrics?.closedToday, icon: CheckCircle, color: 'text-zinc-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-4"
          >
            {isLoading ? (
              <div className="space-y-2" data-testid="metric-skeleton">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Icon size={18} className={color} />
                </div>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {value ?? 0}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Conversas ao longo do dia
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: 8,
                color: '#F8FAFC',
              }}
            />
            <Area
              type="monotone"
              dataKey="conversations"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
