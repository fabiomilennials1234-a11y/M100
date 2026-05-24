import { toast } from 'sonner';

function browserNotify(title: string, body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

export function notifyNewInQueue(phone: string) {
  toast.info(`Nova conversa na fila: ${phone}`);
  browserNotify('Motor100', `Nova conversa na fila: ${phone}`);
}

export function notifyNewMessage(convId: string, preview: string) {
  toast.info(`Nova mensagem: ${preview}`);
  browserNotify('Motor100', `Nova mensagem em ${convId}: ${preview}`);
}

export function requestPermission() {
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
