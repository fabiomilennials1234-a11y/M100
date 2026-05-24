import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ConversationService } from '../conversation/conversation.service';

// TODO: Implementar webhook receiver da UAZAPI
// - Validar assinatura do webhook
// - Parsear payload UAZAPI → InboundMessage
// - Rotear pra ConversationService.handleInboundMessage

@Controller('webhook')
export class ChannelController {
  private readonly logger = new Logger(ChannelController.name);

  constructor(private readonly conversationService: ConversationService) {}

  @Post('uazapi')
  async handleUazapiWebhook(@Body() body: any) {
    this.logger.log('Received UAZAPI webhook');
    // TODO: Parsear payload e chamar conversationService.handleInboundMessage
    return { received: true };
  }
}
