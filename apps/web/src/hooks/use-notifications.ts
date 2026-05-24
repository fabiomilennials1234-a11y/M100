import { useCallback } from 'react';
import { toast } from 'sonner';

function sendBrowserNotification(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/favicon.ico' });
}

export function useNotifications() {
  const notifyNewInQueue = useCallback((phone: string) => {
    toast.info(`Nova conversa na fila: ${phone}`, { duration: 5000 });
    sendBrowserNotification('Nova conversa na fila', `${phone} aguardando atendimento`);
  }, []);

  const notifyNewMessage = useCallback((conversationId: string, preview: string) => {
    toast.info(`Nova mensagem: ${preview}`, { duration: 3000 });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    await Notification.requestPermission();
  }, []);

  return { notifyNewInQueue, notifyNewMessage, requestPermission };
}
