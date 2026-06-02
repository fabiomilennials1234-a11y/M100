import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';

export interface ChannelInstance {
  id: string;
  name: string;
  phone: string | null;
  instanceName: string;
  status: string;
  createdAt: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export function useInstances() {
  const { token } = useAuth();
  return useQuery<ChannelInstance[]>({
    queryKey: ['instances'],
    queryFn: async () => {
      const res = await apiFetch('/api/instances', token!);
      if (!res.ok) throw new Error('Failed to load instances');
      return res.json();
    },
    enabled: !!token,
  });
}

/** Live connection status, polled. Used for status dots and QR auto-close. */
export function useInstanceStatus(id: string | null, enabled = true) {
  const { token } = useAuth();
  return useQuery<{ status: ConnectionStatus }>({
    queryKey: ['instance-status', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/instances/${id}/status`, token!);
      if (!res.ok) throw new Error('Failed to load status');
      return res.json();
    },
    enabled: !!token && !!id && enabled,
    refetchInterval: 4000,
  });
}

export function useCreateInstance() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation<ChannelInstance, Error, { name: string }>({
    mutationFn: async ({ name }) => {
      const res = await apiFetch('/api/instances', token!, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create instance');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }),
  });
}

export function useDeleteInstance() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/instances/${id}`, token!, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete instance');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instances'] }),
  });
}

export async function fetchQrCode(
  id: string,
  token: string,
): Promise<{ base64: string }> {
  const res = await apiFetch(`/api/instances/${id}/qr`, token);
  if (!res.ok) throw new Error('Failed to load QR code');
  return res.json();
}
