import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeftRight, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

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
    <TooltipProvider>
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
                <Badge variant="secondary">
                  {statusLabels[conversation.status] ?? conversation.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => returnToAi.mutate()}
                    />
                  }
                >
                  <ArrowLeftRight size={14} />
                  Devolver para IA
                </TooltipTrigger>
                <TooltipContent>Transferir conversa de volta para a IA</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => closeConversation.mutate()}
                    />
                  }
                >
                  <XCircle size={14} />
                  Encerrar
                </TooltipTrigger>
                <TooltipContent>Encerrar esta conversa</TooltipContent>
              </Tooltip>
            </div>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
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
                      'max-w-[70%] rounded-lg px-3 py-2 text-sm transition-colors duration-150',
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
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-border bg-card px-4 py-3"
          >
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={sendMessage.isPending}
              size="icon"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>

        {/* Context panel */}
        <aside className="hidden w-72 flex-col border-l border-border bg-card lg:flex">
          <div className="p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">Contexto</h3>
            <Separator className="mb-3" />
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
          </div>
        </aside>
      </div>
    </TooltipProvider>
  );
}
