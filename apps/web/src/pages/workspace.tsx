import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeftRight, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  phone: string;
  status: string;
  progressiveSummary: string | null;
  agent: { name: string } | null;
}

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery<ConversationDetail>({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/conversations/${id}`, token!);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!token && !!id,
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['messages', id],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/conversations/${id}/messages?take=50&skip=0`,
        token!,
      );
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!token && !!id,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiFetch(`/api/conversations/${id}/messages`, token!, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
  });

  const returnToAi = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/api/conversations/${id}/return-to-ai`,
        token!,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
  });

  const closeConversation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/conversations/${id}/close`, token!, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
    setInput('');
  }

  const statusLabels: Record<string, string> = {
    nova: 'Nova',
    atendida_pela_ia: 'IA',
    na_fila: 'Na fila',
    atendida_por_humano: 'Humano',
    encerrada: 'Encerrada',
  };

  return (
    <div className="flex h-full">
      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="font-medium text-foreground">
              {conversation?.phone ?? '...'}
            </h2>
            {conversation?.status && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {statusLabels[conversation.status] ?? conversation.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => returnToAi.mutate()}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            >
              <ArrowLeftRight size={14} />
              Devolver para IA
            </button>
            <button
              onClick={() => closeConversation.mutate()}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors duration-150 hover:bg-destructive/90"
            >
              <XCircle size={14} />
              Encerrar
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex',
                msg.direction === 'outbound' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                  msg.direction === 'outbound'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground',
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-border bg-card px-4 py-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={sendMessage.isPending}
            className="cursor-pointer rounded-md bg-primary p-2 text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Context panel */}
      <aside className="hidden w-72 flex-col border-l border-border bg-card p-4 lg:flex">
        <h3 className="mb-3 text-sm font-medium text-foreground">Contexto</h3>
        {conversation?.progressiveSummary && (
          <div className="rounded-md bg-muted p-3 text-sm text-foreground">
            {conversation.progressiveSummary}
          </div>
        )}
        {conversation?.agent && (
          <p className="mt-3 text-sm text-muted-foreground">
            Agente: {conversation.agent.name}
          </p>
        )}
      </aside>
    </div>
  );
}
