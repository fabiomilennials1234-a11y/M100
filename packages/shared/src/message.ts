export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
}

export enum MessageSender {
  CUSTOMER = 'customer',
  AI = 'ai',
  AGENT = 'agent',
  SYSTEM = 'system',
}

export interface MessagePayload {
  conversationId: string;
  direction: MessageDirection;
  type: MessageType;
  sender: MessageSender;
  content: string;
  mediaUrl?: string;
  metadata?: Record<string, unknown>;
}
