import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  Logger,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { DebounceService } from './debounce.service';
import { RateLimitGuard } from './rate-limit.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhook')
export class ChannelController {
  private readonly logger = new Logger(ChannelController.name);

  constructor(
    private readonly debounceService: DebounceService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('uazapi/:instanceId')
  @UseGuards(RateLimitGuard)
  async handleUazapiWebhook(
    @Param('instanceId') instanceId: string,
    @Body() body: any,
    @Headers('x-webhook-secret') secret?: string,
  ) {
    const instance = await this.prisma.channelInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance || secret !== instance.webhookSecret) {
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

    this.debounceService.debounce(phone, content, instanceId);

    return { received: true };
  }
}
