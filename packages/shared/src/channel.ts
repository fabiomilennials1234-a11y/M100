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

/**
 * Seeded by the Fase 6 migration. Legacy single-number flows (manual test
 * endpoint, pre-multi-instance webhooks) attribute conversations to this
 * instance until the per-instance webhook is wired (ChannelService refactor).
 */
export const DEFAULT_CHANNEL_INSTANCE_ID =
  '00000000-0000-0000-0000-000000000001';
