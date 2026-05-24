import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChannelSender, OutboundMessage } from '@motor100/shared';
import axios from 'axios';

@Injectable()
export class ChannelService implements ChannelSender {
  private readonly logger = new Logger(ChannelService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('UAZAPI_BASE_URL') ?? '';
    this.token = this.config.get<string>('UAZAPI_TOKEN') ?? '';
  }

  async send(message: OutboundMessage): Promise<{ externalId: string }> {
    this.logger.log(`Sending message to ${message.to}`);

    const response = await axios.post(
      `${this.baseUrl}/sendText`,
      { phone: message.to, message: message.content },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      },
    );

    return { externalId: response.data.key?.id ?? `uazapi-${Date.now()}` };
  }
}
