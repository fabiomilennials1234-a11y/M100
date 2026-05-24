// TODO: Interface do Integration Hub — porta pro ERP futuro

export interface IntegrationProvider {
  syncContact(phone: string, data: Record<string, unknown>): Promise<void>;
  syncConversation(conversationId: string, data: Record<string, unknown>): Promise<void>;
}
