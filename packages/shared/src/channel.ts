export interface InboundMessage {
  externalId: string;
  from: string;
  content: string;
  type: string;
  mediaUrl?: string;
  timestamp: Date;
  raw?: Record<string, unknown>;
}

export interface OutboundMessage {
  to: string;
  content: string;
  type: string;
  mediaUrl?: string;
}

export interface ChannelSender {
  send(message: OutboundMessage): Promise<{ externalId: string }>;
}

export interface ChannelReceiver {
  onMessage(handler: (message: InboundMessage) => Promise<void>): void;
}
