import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { mockOn, mockSubscribe, mockRemoveChannel, mockChannel } = vi.hoisted(() => {
  const mockSubscribe = vi.fn();
  const mockOn = vi.fn();
  const channelObj = {
    on: mockOn,
    subscribe: mockSubscribe,
  };
  mockOn.mockReturnValue(channelObj);
  mockSubscribe.mockReturnValue(channelObj);
  const mockChannel = vi.fn().mockReturnValue(channelObj);
  const mockRemoveChannel = vi.fn();
  return { mockOn, mockSubscribe, mockRemoveChannel, mockChannel };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

import { useRealtime } from './use-realtime';

function createWrapper() {
  const qc = new QueryClient();
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper, invalidateSpy, qc };
}

describe('useRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const channelObj = {
      on: mockOn,
      subscribe: mockSubscribe,
    };
    mockOn.mockReturnValue(channelObj);
    mockSubscribe.mockReturnValue(channelObj);
    mockChannel.mockReturnValue(channelObj);
  });

  it('subscribes to Conversation postgres_changes', () => {
    const { wrapper } = createWrapper();
    renderHook(() => useRealtime(), { wrapper });
    expect(mockChannel).toHaveBeenCalledWith('conversations-realtime');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Conversation' },
      expect.any(Function),
    );
  });

  it('invalidates queue and metrics on Conversation change', () => {
    const { wrapper, invalidateSpy } = createWrapper();
    renderHook(() => useRealtime(), { wrapper });
    // Get the Conversation callback
    const convCallback = mockOn.mock.calls[0][2];
    convCallback({ new: { id: 'c1' }, old: {} });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['queue'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['metrics'] });
  });

  it('invalidates specific conversation on change', () => {
    const { wrapper, invalidateSpy } = createWrapper();
    renderHook(() => useRealtime(), { wrapper });
    const convCallback = mockOn.mock.calls[0][2];
    convCallback({ new: { id: 'c42' }, old: {} });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['conversation', 'c42'],
    });
  });

  it('subscribes to Message INSERT events', () => {
    const { wrapper } = createWrapper();
    renderHook(() => useRealtime(), { wrapper });
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'Message' },
      expect.any(Function),
    );
  });

  it('invalidates messages on new message', () => {
    const { wrapper, invalidateSpy } = createWrapper();
    renderHook(() => useRealtime(), { wrapper });
    // Message callback is the second .on() call
    const msgCallback = mockOn.mock.calls[1][2];
    msgCallback({ new: { conversationId: 'c7' } });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['messages', 'c7'],
    });
  });

  it('unsubscribes on unmount', () => {
    const { wrapper } = createWrapper();
    const { unmount } = renderHook(() => useRealtime(), { wrapper });
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
