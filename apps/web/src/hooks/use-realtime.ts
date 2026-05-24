import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Conversation' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['metrics'] });
          const id =
            (payload.new as Record<string, unknown>)?.id ??
            (payload.old as Record<string, unknown>)?.id;
          if (id) {
            queryClient.invalidateQueries({
              queryKey: ['conversation', id],
            });
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message' },
        (payload) => {
          const msg = payload.new as Record<string, unknown>;
          if (msg.conversationId) {
            queryClient.invalidateQueries({
              queryKey: ['messages', msg.conversationId],
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
