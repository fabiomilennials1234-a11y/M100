import { Test, TestingModule } from '@nestjs/testing';
import { ChannelController } from './channel.controller';
import { ConversationService } from '../conversation/conversation.service';
import { DebounceService } from './debounce.service';
import { RateLimitGuard, REDIS_CLIENT } from './rate-limit.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

const INSTANCE_ID = 'inst-1';

describe('ChannelController', () => {
  let controller: ChannelController;
  let debounceService: DebounceService;
  let module: TestingModule;

  const validPayload = {
    event: 'messages.upsert',
    data: {
      key: { remoteJid: '5511999990000@s.whatsapp.net', id: 'MSG001', fromMe: false },
      message: { conversation: 'Oi, preciso de ajuda' },
      messageTimestamp: 1716537600,
    },
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [ChannelController],
      providers: [
        {
          provide: ConversationService,
          useValue: { handleInboundMessage: jest.fn() },
        },
        {
          provide: DebounceService,
          useValue: { debounce: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            channelInstance: {
              findUnique: jest.fn().mockResolvedValue({
                id: INSTANCE_ID,
                webhookSecret: 'valid-secret',
              }),
            },
          },
        },
        RateLimitGuard,
        {
          provide: REDIS_CLIENT,
          useValue: { incr: jest.fn().mockResolvedValue(1), ttl: jest.fn().mockResolvedValue(-1), expire: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(ChannelController);
    debounceService = module.get(DebounceService);
  });

  it('returns { received: true } on valid webhook', async () => {
    const result = await controller.handleUazapiWebhook(INSTANCE_ID, validPayload, 'valid-secret');
    expect(result).toEqual({ received: true });
  });

  it('rejects invalid token with 401', async () => {
    await expect(
      controller.handleUazapiWebhook(INSTANCE_ID, validPayload, 'wrong-secret'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects unknown instance with 401', async () => {
    const prisma = module.get(PrismaService);
    (prisma.channelInstance.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      controller.handleUazapiWebhook('ghost', validPayload, 'valid-secret'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('normalizes UAZAPI payload and routes to debounce with the instanceId', async () => {
    await controller.handleUazapiWebhook(INSTANCE_ID, validPayload, 'valid-secret');

    expect(debounceService.debounce).toHaveBeenCalledWith(
      '+5511999990000',
      'Oi, preciso de ajuda',
      INSTANCE_ID,
    );
  });

  it('rejects malformed payload with 400', async () => {
    await expect(
      controller.handleUazapiWebhook(INSTANCE_ID, { event: 'messages.upsert' }, 'valid-secret'),
    ).rejects.toThrow(BadRequestException);
  });

  it('ignores non-message events', async () => {
    const result = await controller.handleUazapiWebhook(
      INSTANCE_ID,
      { event: 'connection.update', data: {} },
      'valid-secret',
    );
    expect(result).toEqual({ received: true });
    expect(debounceService.debounce).not.toHaveBeenCalled();
  });

  it('extracts phone from remoteJid correctly', async () => {
    const payload = {
      ...validPayload,
      data: {
        ...validPayload.data,
        key: { ...validPayload.data.key, remoteJid: '5521888880000@s.whatsapp.net' },
      },
    };

    await controller.handleUazapiWebhook(INSTANCE_ID, payload, 'valid-secret');

    expect(debounceService.debounce).toHaveBeenCalledWith(
      '+5521888880000',
      'Oi, preciso de ajuda',
      INSTANCE_ID,
    );
  });

  it('ignores fromMe messages', async () => {
    const payload = {
      ...validPayload,
      data: {
        ...validPayload.data,
        key: { ...validPayload.data.key, fromMe: true },
      },
    };

    const result = await controller.handleUazapiWebhook(INSTANCE_ID, payload, 'valid-secret');
    expect(result).toEqual({ received: true });
    expect(debounceService.debounce).not.toHaveBeenCalled();
  });
});
