import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChannelService } from './channel.service';
import { CryptoService } from '../crypto/crypto.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const VALID_KEY = '0'.repeat(64);

function setup() {
  const crypto = new CryptoService({
    get: () => VALID_KEY,
  } as unknown as ConfigService);

  const prisma = {
    channelInstance: { findUnique: jest.fn() },
  };

  const service = new ChannelService(prisma as any, crypto);
  return { service, prisma, crypto };
}

describe('ChannelService', () => {
  afterEach(() => jest.clearAllMocks());

  it('resolves the instance credentials from the DB and sends via its server', async () => {
    const { service, prisma, crypto } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue({
      id: 'inst-1',
      serverUrl: 'https://srv.uazapi.com/i/abc',
      instanceToken: crypto.encrypt('real-instance-token'),
    });
    mockedAxios.post.mockResolvedValue({ data: { key: { id: 'ext-1' } } });

    const result = await service.send(
      { to: '+5511999990000', content: 'Olá', type: 'text' },
      'inst-1',
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://srv.uazapi.com/i/abc/sendText',
      { phone: '+5511999990000', message: 'Olá' },
      { headers: { token: 'real-instance-token' } },
    );
    expect(result.externalId).toBe('ext-1');
  });

  it('caches decrypted credentials so repeated sends do not hit the DB each time', async () => {
    const { service, prisma, crypto } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue({
      id: 'inst-1',
      serverUrl: 'https://srv.uazapi.com',
      instanceToken: crypto.encrypt('tok'),
    });
    mockedAxios.post.mockResolvedValue({ data: { key: { id: 'x' } } });

    await service.send({ to: '+551', content: 'a', type: 'text' }, 'inst-1');
    await service.send({ to: '+551', content: 'b', type: 'text' }, 'inst-1');

    expect(prisma.channelInstance.findUnique).toHaveBeenCalledTimes(1);
  });

  it('throws when the instance does not exist', async () => {
    const { service, prisma } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue(null);

    await expect(
      service.send({ to: '+551', content: 'a', type: 'text' }, 'ghost'),
    ).rejects.toThrow(/not found/i);
  });
});
