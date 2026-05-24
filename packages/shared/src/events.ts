export enum DomainEvent {
  CONVERSATION_CREATED = 'conversation.created',
  CONVERSATION_STATUS_CHANGED = 'conversation.status_changed',
  CONVERSATION_OWNER_CHANGED = 'conversation.owner_changed',
  CONVERSATION_CLOSED = 'conversation.closed',
  CONVERSATION_REOPENED = 'conversation.reopened',
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_SENT = 'message.sent',
  HANDOFF_REQUESTED = 'handoff.requested',
  HANDOFF_COMPLETED = 'handoff.completed',
  AGENT_ASSIGNED = 'agent.assigned',
  AI_RESPONSE_GENERATED = 'ai.response_generated',
}
