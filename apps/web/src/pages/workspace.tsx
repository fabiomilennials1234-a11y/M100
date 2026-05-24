import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import { Send, XCircle, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'customer' | 'agent' | 'ai';
  direction: 'inbound' | 'outbound';
  createdAt: string;
}

interface Conversation {
  id: string;
  externalPhone: string;
  status: string;
  ownerType: string;
  agentId: string | null;
  progressiveSummary: string | null;
  agent: { id: string; name: string } | null;
}

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/conversations/${id}`, token);
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/conversations/${id}/messages`, token);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiFetch(`/api/conversations/${id}/messages`, token, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async (action: 'close' | 'return-to-ai') => {
      const res = await apiFetch(`/api/conversations/${id}/${action}`, token, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
  });

  function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
    setInput('');
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-medium text-foreground">{conversation?.externalPhone}</p>
            <p className="text-xs text-muted-foreground">{conversation?.status}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => actionMutation.mutate('return-to-ai')}
              disabled={actionMutation.isPending}
              aria-label="Devolver para IA"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Bot className="h-3.5 w-3.5" />
              Devolver para IA
            </button>
            <button
              onClick={() => actionMutation.mutate('close')}
              disabled={actionMutation.isPending}
              aria-label="Encerrar"
              className="flex items-center gap-1.5 rounded-md border border-destructive/50 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <XCircle className="h-3.5 w-3.5" />
              Encerrar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                msg.direction === 'inbound'
                  ? 'self-start bg-muted text-foreground'
                  : 'ml-auto bg-primary text-primary-foreground',
              )}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !input.trim()}
            aria-label="Enviar"
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <aside className="hidden w-72 border-l border-border p-4 lg:block">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Contexto</h2>
        {conversation?.progressiveSummary && (
          <div className="rounded-md bg-muted p-3 text-sm text-foreground">
            {conversation.progressiveSummary}
          </div>
        )}
        {conversation?.agent && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">Atendente</p>
            <p className="text-sm font-medium text-foreground">{conversation.agent.name}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
