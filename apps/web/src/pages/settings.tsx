import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Smartphone,
  Trash2,
  Loader2,
  CheckCircle2,
  QrCode as QrIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import {
  useInstances,
  useInstanceStatus,
  useCreateInstance,
  useDeleteInstance,
  fetchQrCode,
  type ChannelInstance,
  type ConnectionStatus,
} from '@/hooks/use-instances';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const STATUS_META: Record<
  ConnectionStatus,
  { label: string; dot: string; text: string }
> = {
  connected: { label: 'Conectado', dot: 'bg-success', text: 'text-success' },
  connecting: { label: 'Conectando', dot: 'bg-warning', text: 'text-warning' },
  disconnected: {
    label: 'Desconectado',
    dot: 'bg-zinc-500',
    text: 'text-muted-foreground',
  },
};

function StatusDot({ status }: { status: ConnectionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {status !== 'disconnected' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              meta.dot,
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', meta.dot)} />
      </span>
      <span className={cn('text-xs font-medium', meta.text)}>{meta.label}</span>
    </span>
  );
}

function InstanceCard({
  instance,
  onDelete,
  deleting,
}: {
  instance: ChannelInstance;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const { data } = useInstanceStatus(instance.id);
  const status = (data?.status ?? instance.status) as ConnectionStatus;

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {instance.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {instance.phone ?? 'Número não conectado'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remover ${instance.name}`}
            disabled={deleting}
            onClick={() => onDelete(instance.id)}
          >
            {deleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} className="text-muted-foreground" />
            )}
          </Button>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <StatusDot status={status} />
        </div>
      </CardContent>
    </Card>
  );
}

type ConnectPhase = 'name' | 'qr';

function ConnectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { token } = useAuth();
  const [phase, setPhase] = useState<ConnectPhase>('name');
  const [name, setName] = useState('');
  const [created, setCreated] = useState<ChannelInstance | null>(null);

  const createInstance = useCreateInstance();
  const status = useInstanceStatus(created?.id ?? null, phase === 'qr');

  const qr = useQuery({
    queryKey: ['instance-qr', created?.id],
    queryFn: () => fetchQrCode(created!.id, token!),
    enabled: phase === 'qr' && !!created && !!token,
  });

  const connected = status.data?.status === 'connected';

  // Reset when the dialog closes.
  useEffect(() => {
    if (!open) {
      setPhase('name');
      setName('');
      setCreated(null);
    }
  }, [open]);

  // Auto-close shortly after the number connects.
  useEffect(() => {
    if (!connected) return;
    toast.success('Número conectado');
    const t = setTimeout(() => onOpenChange(false), 1500);
    return () => clearTimeout(t);
  }, [connected, onOpenChange]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const instance = await createInstance.mutateAsync({ name: name.trim() });
      setCreated(instance);
      setPhase('qr');
    } catch {
      toast.error('Falha ao criar instância');
    }
  }

  const qrSrc = qr.data?.base64
    ? qr.data.base64.startsWith('data:')
      ? qr.data.base64
      : `data:image/png;base64,${qr.data.base64}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {phase === 'name' ? 'Conectar número' : created?.name}
          </DialogTitle>
          <DialogDescription>
            {phase === 'name'
              ? 'Dê um nome ao número para identificá-lo (ex.: Vendas, Suporte).'
              : 'Abra o WhatsApp no celular e escaneie o QR Code abaixo.'}
          </DialogDescription>
        </DialogHeader>

        {phase === 'name' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="instance-name">Nome</Label>
              <Input
                id="instance-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vendas"
              />
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={!name.trim() || createInstance.isPending}
            >
              {createInstance.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <QrIcon size={16} />
              )}
              Gerar QR Code
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-xl bg-white p-3 ring-1 ring-foreground/10">
              {connected ? (
                <div className="flex flex-col items-center gap-2 text-success">
                  <CheckCircle2 size={56} />
                  <span className="text-sm font-medium">Conectado</span>
                </div>
              ) : qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR Code para conexão"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Loader2 size={28} className="animate-spin text-zinc-400" />
              )}
            </div>
            {!connected && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
                </span>
                Aguardando leitura…
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function SettingsPage() {
  const { data: instances, isLoading } = useInstances();
  const deleteInstance = useDeleteInstance();
  const [connectOpen, setConnectOpen] = useState(false);

  function handleDelete(id: string) {
    deleteInstance.mutate(id, {
      onSuccess: () => toast.success('Número removido'),
      onError: () => toast.error('Falha ao remover'),
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Números de WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Conecte e gerencie os números atendidos pela Motor100.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setConnectOpen(true)}>
          <Plus size={16} />
          Conectar número
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} size="sm" data-testid="instance-skeleton">
              <CardContent className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : instances && instances.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onDelete={handleDelete}
              deleting={
                deleteInstance.isPending &&
                deleteInstance.variables === instance.id
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Smartphone size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Nenhum número conectado
              </p>
              <p className="text-sm text-muted-foreground">
                Conecte o primeiro número para começar a atender.
              </p>
            </div>
            <Button className="gap-2" onClick={() => setConnectOpen(true)}>
              <Plus size={16} />
              Conectar número
            </Button>
          </CardContent>
        </Card>
      )}

      <ConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}
