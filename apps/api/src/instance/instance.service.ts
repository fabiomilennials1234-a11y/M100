import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  ChannelInstanceView,
  CreateInstanceInput,
  InstanceConnectionStatus,
  InstancePort,
  QrCodeResult,
} from '@motor100/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { UazapiInstanceClient } from './uazapi-instance.client';

@Injectable()
export class InstanceService implements InstancePort {
  private readonly logger = new Logger(InstanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly uazapi: UazapiInstanceClient,
    private readonly config: ConfigService,
  ) {}

  async create(input: CreateInstanceInput): Promise<ChannelInstanceView> {
    const serverUrl = this.config.get<string>('UAZAPI_SERVER_URL') ?? '';
    const adminToken = this.config.get<string>('UAZAPI_ADMIN_TOKEN') ?? '';

    const { instanceName, token } = await this.uazapi.init(
      serverUrl,
      adminToken,
      input.name,
    );

    const row = await this.prisma.channelInstance.create({
      data: {
        name: input.name,
        instanceName,
        serverUrl,
        instanceToken: this.crypto.encrypt(token),
        webhookSecret: randomUUID(),
        status: 'disconnected',
      },
    });

    return this.toView(row);
  }

  async registerWebhook(id: string): Promise<void> {
    const { serverUrl, token } = await this.resolveCredentials(id);
    const publicUrl = this.config.get<string>('API_PUBLIC_URL') ?? '';
    const webhookUrl = `${publicUrl}/webhook/uazapi/${id}`;
    await this.uazapi.setWebhook(serverUrl, token, webhookUrl);
  }

  async getQrCode(id: string): Promise<QrCodeResult> {
    const { serverUrl, token } = await this.resolveCredentials(id);
    const { qrcode } = await this.uazapi.connect(serverUrl, token);
    return { base64: qrcode };
  }

  async getStatus(id: string): Promise<InstanceConnectionStatus> {
    const { serverUrl, token } = await this.resolveCredentials(id);
    const raw = await this.uazapi.status(serverUrl, token);
    return this.mapStatus(raw);
  }

  async remove(id: string): Promise<void> {
    const { serverUrl, token } = await this.resolveCredentials(id);
    await this.uazapi.delete(serverUrl, token);
    await this.prisma.channelInstance.delete({ where: { id } });
  }

  async findAll(): Promise<ChannelInstanceView[]> {
    const rows = await this.prisma.channelInstance.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toView(row));
  }

  async findById(id: string): Promise<ChannelInstanceView | null> {
    const row = await this.prisma.channelInstance.findUnique({ where: { id } });
    return row ? this.toView(row) : null;
  }

  private mapStatus(raw: string): InstanceConnectionStatus {
    switch (raw) {
      case 'connected':
      case 'open':
        return 'connected';
      case 'connecting':
      case 'qrcode':
        return 'connecting';
      default:
        return 'disconnected';
    }
  }

  /** Loads an instance and returns its server URL + decrypted token. */
  private async resolveCredentials(
    id: string,
  ): Promise<{ serverUrl: string; token: string }> {
    const row = await this.prisma.channelInstance.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Channel instance ${id} not found`);
    }
    return {
      serverUrl: row.serverUrl,
      token: this.crypto.decrypt(row.instanceToken),
    };
  }

  private toView(row: {
    id: string;
    name: string;
    phone: string | null;
    instanceName: string;
    status: string;
    createdAt: Date;
  }): ChannelInstanceView {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      instanceName: row.instanceName,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
