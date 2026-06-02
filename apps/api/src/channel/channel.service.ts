import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChannelSender, OutboundMessage } from '@motor100/shared';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

interface CachedInstance {
  serverUrl: string;
  token: string;
  expiresAt: number;
}

/** TTL for in-memory credential cache — avoids a DB hit + decrypt per message. */
const CREDENTIAL_TTL_MS = 60_000;

@Injectable()
export class ChannelService implements ChannelSender {
  private readonly logger = new Logger(ChannelService.name);
  private readonly cache = new Map<string, CachedInstance>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async send(
    message: OutboundMessage,
    instanceId: string,
  ): Promise<{ externalId: string }> {
    const { serverUrl, token } = await this.resolveInstance(instanceId);
    this.logger.log(`Sending message to ${message.to} via ${instanceId}`);

    const response = await axios.post(
      `${serverUrl}/sendText`,
      { phone: message.to, message: message.content },
      { headers: { token } },
    );

    return { externalId: response.data.key?.id ?? `uazapi-${Date.now()}` };
  }

  /** Loads + decrypts instance credentials, cached with a short TTL. */
  private async resolveInstance(instanceId: string): Promise<CachedInstance> {
    const now = Date.now();
    const cached = this.cache.get(instanceId);
    if (cached && cached.expiresAt > now) {
      return cached;
    }

    const row = await this.prisma.channelInstance.findUnique({
      where: { id: instanceId },
    });
    if (!row) {
      throw new NotFoundException(`Channel instance ${instanceId} not found`);
    }

    const entry: CachedInstance = {
      serverUrl: row.serverUrl,
      token: this.crypto.decrypt(row.instanceToken),
      expiresAt: now + CREDENTIAL_TTL_MS,
    };
    this.cache.set(instanceId, entry);
    return entry;
  }
}
