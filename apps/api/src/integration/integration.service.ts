import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider } from '@motor100/shared';

// TODO: Implementar Integration Hub quando ERP for definido
// - Sync de contatos
// - Sync de conversas
// - Webhooks bidirecionais

@Injectable()
export class IntegrationService implements IntegrationProvider {
  private readonly logger = new Logger(IntegrationService.name);

  async syncContact(phone: string, data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Sync contact ${phone} — not implemented`);
  }

  async syncConversation(conversationId: string, data: Record<string, unknown>): Promise<void> {
    this.logger.log(`Sync conversation ${conversationId} — not implemented`);
  }
}
