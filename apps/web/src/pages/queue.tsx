import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import { Inbox } from 'lucide-react';

interface QueuedConversation {
  id: string;
  externalPhone: string;
  status: string;
  ownerType: string;
  updatedAt: string;
  progressiveSummary: string | null;
}

export function QueuePage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery<QueuedConversation[]>({
    queryKey: ['queue'],
    queryFn: async () => {
      const res = await apiFetch('/api/conversations?status=na_fila', token);
      if (!res.ok) throw new Error('Failed to fetch queue');
      return res.json();
    },
    refetchInterval: 10_000,
  });

  const claimMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await apiFetch(`/api/conversations/${conversationId}/assign`, token, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to claim');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-xl font-bold text-foreground">Fila</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="mt-2 h-3 w-48 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-foreground">Fila</h1>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Inbox className="h-10 w-10" />
          <p>Nenhuma conversa na fila</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{conv.externalPhone}</p>
                {conv.progressiveSummary && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {conv.progressiveSummary}
                  </p>
                )}
              </div>
              <button
                onClick={() => claimMutation.mutate(conv.id)}
                disabled={claimMutation.isPending}
                className="ml-4 shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Atender
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
