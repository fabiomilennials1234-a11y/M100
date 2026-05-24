import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealtimeConversations() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Conversation' },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['metrics'] });
          if (payload.new?.id) {
            queryClient.invalidateQueries({ queryKey: ['conversation', payload.new.id] });
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message' },
        (payload: any) => {
          if (payload.new?.conversationId) {
            queryClient.invalidateQueries({ queryKey: ['messages', payload.new.conversationId] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
