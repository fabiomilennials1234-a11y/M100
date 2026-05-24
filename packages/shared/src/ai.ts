export enum AIAction {
  RESPOND = 'respond',
  HANDOFF = 'handoff',
}

export interface AIDecision {
  action: AIAction;
  reason: string;
  message?: string;
}

export interface AIProvider {
  generateResponse(conversationId: string, messages: Array<{ role: string; content: string }>): Promise<AIDecision>;
}
