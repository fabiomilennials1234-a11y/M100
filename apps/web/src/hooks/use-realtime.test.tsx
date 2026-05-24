import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

const { mockChannel, mockRemoveChannel } = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };
  const mockRemoveChannel = vi.fn();
  return { mockChannel, mockRemoveChannel };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue(mockChannel),
    removeChannel: mockRemoveChannel,
  },
}));

import { supabase } from '@/lib/supabase';
import { useRealtimeConversations } from './use-realtime';

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useRealtimeConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnThis();
    mockChannel.subscribe.mockReturnThis();
    (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('subscribes to conversation changes on mount', () => {
    renderHook(() => useRealtimeConversations(), { wrapper });

    expect(supabase.channel).toHaveBeenCalledWith('conversations-realtime');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'Conversation',
      }),
      expect.any(Function),
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('invalidates queue and metrics queries on conversation change', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useRealtimeConversations(), { wrapper });

    const callback = mockChannel.on.mock.calls[0][2];
    act(() => {
      callback({ eventType: 'UPDATE', new: { id: 'conv-1', status: 'na_fila' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['queue'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['metrics'] });
  });

  it('invalidates specific conversation query on update', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useRealtimeConversations(), { wrapper });

    const callback = mockChannel.on.mock.calls[0][2];
    act(() => {
      callback({ eventType: 'UPDATE', new: { id: 'conv-42', status: 'atendida_humano' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['conversation', 'conv-42'] });
  });

  it('also subscribes to message inserts', () => {
    renderHook(() => useRealtimeConversations(), { wrapper });

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'Message',
      }),
      expect.any(Function),
    );
  });

  it('invalidates messages query on new message', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useRealtimeConversations(), { wrapper });

    const messageCallback = mockChannel.on.mock.calls[1][2];
    act(() => {
      messageCallback({ eventType: 'INSERT', new: { id: 'msg-1', conversationId: 'conv-5' } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['messages', 'conv-5'] });
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeConversations(), { wrapper });
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});
