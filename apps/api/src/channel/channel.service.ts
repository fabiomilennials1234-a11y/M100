import { Injectable, Logger } from '@nestjs/common';
import { ChannelSender, ChannelReceiver, OutboundMessage, InboundMessage } from '@motor100/shared';

// TODO: Implementar adapter UAZAPI
// - Receber webhooks da UAZAPI
// - Enviar mensagens via UAZAPI API
// - Interface trocável pra Cloud API futura

@Injectable()
export class ChannelService implements ChannelSender {
  private readonly logger = new Logger(ChannelService.name);

  async send(message: OutboundMessage): Promise<{ externalId: string }> {
    this.logger.log(`Sending message to ${message.to}: ${message.content}`);
    // TODO: Chamar UAZAPI API
    return { externalId: `stub-${Date.now()}` };
  }
}
