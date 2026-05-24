import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ChannelService', () => {
  let service: ChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                UAZAPI_BASE_URL: 'https://api.uazapi.com',
                UAZAPI_TOKEN: 'test-token-123',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ChannelService);
  });

  it('sends text message via UAZAPI API', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { key: { id: 'ext-msg-001' } },
    });

    const result = await service.send({
      to: '+5511999990000',
      content: 'Olá! Como posso ajudar?',
      type: 'text',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.uazapi.com/sendText',
      { phone: '+5511999990000', message: 'Olá! Como posso ajudar?' },
      { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token-123' } },
    );
    expect(result.externalId).toBe('ext-msg-001');
  });

  it('throws on UAZAPI API failure', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      service.send({ to: '+5511999990000', content: 'test', type: 'text' }),
    ).rejects.toThrow('Network error');
  });
});
