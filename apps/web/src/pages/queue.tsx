import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';

interface Conversation {
  id: string;
  phone: string;
  progressiveSummary: string | null;
  createdAt: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

export function QueuePage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['queue'],
    queryFn: async () => {
      const res = await apiFetch('/api/conversations?status=na_fila', token!);
      if (!res.ok) throw new Error('Failed to fetch queue');
      return res.json();
    },
    refetchInterval: 10_000,
    enabled: !!token,
  });

  const assign = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/conversations/${id}/assign`, token!, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to assign');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-foreground">Fila de Atendimento</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-card border border-border"
              data-testid="queue-skeleton"
            />
          ))}
        </div>
      ) : !conversations?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox size={48} className="mb-3" />
          <p className="text-sm">Nenhuma conversa na fila</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{conv.phone}</p>
                {conv.progressiveSummary && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {conv.progressiveSummary}
                  </p>
                )}
              </div>
              <div className="ml-4 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {timeAgo(conv.createdAt)}
                </span>
                <button
                  onClick={() => assign.mutate(conv.id)}
                  disabled={assign.isPending}
                  className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
                >
                  Atender
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
