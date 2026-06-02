import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

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
            <Skeleton
              key={i}
              className="h-20 w-full rounded-lg"
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
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-3 pr-3">
            {conversations.map((conv) => (
              <Card key={conv.id} size="sm">
                <CardContent className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{conv.phone}</p>
                    {conv.progressiveSummary && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {conv.progressiveSummary}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <Badge variant="secondary">
                      {timeAgo(conv.createdAt)}
                    </Badge>
                    <Button
                      onClick={() => assign.mutate(conv.id)}
                      disabled={assign.isPending}
                      size="sm"
                    >
                      Atender
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
