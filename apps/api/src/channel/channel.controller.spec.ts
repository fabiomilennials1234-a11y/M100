import { Test, TestingModule } from '@nestjs/testing';
import { ChannelController } from './channel.controller';
import { ConversationService } from '../conversation/conversation.service';
import { DebounceService } from './debounce.service';
import { RateLimitGuard, REDIS_CLIENT } from './rate-limit.guard';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('ChannelController', () => {
  let controller: ChannelController;
  let debounceService: DebounceService;

  const validPayload = {
    event: 'messages.upsert',
    data: {
      key: { remoteJid: '5511999990000@s.whatsapp.net', id: 'MSG001', fromMe: false },
      message: { conversation: 'Oi, preciso de ajuda' },
      messageTimestamp: 1716537600,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
        RateLimitGuard,
        {
          provide: REDIS_CLIENT,
          useValue: { incr: jest.fn().mockResolvedValue(1), ttl: jest.fn().mockResolvedValue(-1), expire: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(ChannelController);
    debounceService = module.get(DebounceService);

    process.env.UAZAPI_WEBHOOK_SECRET = 'valid-secret';
  });

  it('returns { received: true } on valid webhook', async () => {
    const result = await controller.handleUazapiWebhook(validPayload, 'valid-secret');
    expect(result).toEqual({ received: true });
  });

  it('rejects invalid token with 401', async () => {
    await expect(
      controller.handleUazapiWebhook(validPayload, 'wrong-secret'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('normalizes UAZAPI payload and routes to debounce', async () => {
    await controller.handleUazapiWebhook(validPayload, 'valid-secret');

    expect(debounceService.debounce).toHaveBeenCalledWith(
      '+5511999990000',
      'Oi, preciso de ajuda',
    );
  });

  it('rejects malformed payload with 400', async () => {
    await expect(
      controller.handleUazapiWebhook({ event: 'messages.upsert' }, 'valid-secret'),
    ).rejects.toThrow(BadRequestException);
  });

  it('ignores non-message events', async () => {
    const result = await controller.handleUazapiWebhook(
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

    await controller.handleUazapiWebhook(payload, 'valid-secret');

    expect(debounceService.debounce).toHaveBeenCalledWith(
      '+5521888880000',
      'Oi, preciso de ajuda',
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

    const result = await controller.handleUazapiWebhook(payload, 'valid-secret');
    expect(result).toEqual({ received: true });
    expect(debounceService.debounce).not.toHaveBeenCalled();
  });
});
