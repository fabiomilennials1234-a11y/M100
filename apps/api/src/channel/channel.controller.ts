import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { DebounceService } from './debounce.service';

@Controller('webhook')
export class ChannelController {
  private readonly logger = new Logger(ChannelController.name);

  constructor(private readonly debounceService: DebounceService) {}

  @Post('uazapi')
  async handleUazapiWebhook(
    @Body() body: any,
    @Headers('x-webhook-secret') secret?: string,
  ) {
    const expectedSecret = process.env.UAZAPI_WEBHOOK_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    if (body.event !== 'messages.upsert') {
      return { received: true };
    }

    const data = body.data;
    if (!data?.key?.remoteJid || !data?.message) {
      throw new BadRequestException('Malformed UAZAPI payload');
    }

    if (data.key.fromMe) {
      return { received: true };
    }

    const phone = '+' + data.key.remoteJid.replace('@s.whatsapp.net', '');
    const content = data.message.conversation
      ?? data.message.extendedTextMessage?.text
      ?? '';

    if (!content) {
      this.logger.warn(`Non-text message from ${phone} — skipping (Fase 3)`);
      return { received: true };
    }

    this.debounceService.debounce(phone, content);

    return { received: true };
  }
}
