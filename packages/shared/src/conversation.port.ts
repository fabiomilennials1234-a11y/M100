import { ConversationStatus, OwnerType } from './conversation';

export interface ConversationEntity {
  id: string;
  externalPhone: string;
  instanceId: string;
  status: ConversationStatus;
  ownerType: OwnerType;
  agentId: string | null;
  version: number;
  progressiveSummary: string | null;
  finalSummary: string | null;
  summaryMessageCount: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface MessageEntity {
  id: string;
  conversationId: string;
  direction: string;
  type: string;
  sender: string;
  content: string;
  mediaUrl: string | null;
  createdAt: Date;
}

export interface ConversationFilter {
  status?: ConversationStatus;
  ownerType?: OwnerType;
  agentId?: string;
}

export interface ConversationMetrics {
  active: number;
  queued: number;
  aiHandled: number;
  humanHandled: number;
  closedToday: number;
}

export interface ConversationPort {
  findOrCreate(externalPhone: string, instanceId: string): Promise<ConversationEntity>;
  transition(id: string, targetStatus: ConversationStatus, agentId?: string): Promise<ConversationEntity>;
  handleInboundMessage(externalPhone: string, content: string, type?: string, instanceId?: string): Promise<{ conversation: ConversationEntity; message: MessageEntity }>;
  handleOutboundMessage(conversationId: string, content: string, senderType: string): Promise<MessageEntity>;
  requestHandoff(id: string): Promise<ConversationEntity>;
  assignAgent(id: string, agentId: string): Promise<ConversationEntity>;
  returnToAi(id: string): Promise<ConversationEntity>;
  close(id: string): Promise<ConversationEntity>;
  findById(id: string): Promise<ConversationEntity | null>;
  findMany(filter: ConversationFilter): Promise<ConversationEntity[]>;
  getMessages(conversationId: string, take?: number, skip?: number): Promise<MessageEntity[]>;
  getMetrics(): Promise<ConversationMetrics>;
}
