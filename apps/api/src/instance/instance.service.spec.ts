import { ConfigService } from '@nestjs/config';
import { CryptoService } from '../crypto/crypto.service';
import { InstanceService } from './instance.service';
import { UazapiInstanceClient } from './uazapi-instance.client';

const VALID_KEY = '0'.repeat(64);

function setup() {
  const crypto = new CryptoService({
    get: () => VALID_KEY,
  } as unknown as ConfigService);

  const prisma = {
    channelInstance: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };

  const client = {
    init: jest.fn(),
    connect: jest.fn(),
    status: jest.fn(),
    setWebhook: jest.fn(),
    delete: jest.fn(),
  };

  const config = {
    get: (key: string) =>
      (
        ({
          UAZAPI_SERVER_URL: 'https://srv.uazapi.com',
          UAZAPI_ADMIN_TOKEN: 'admin-xyz',
          API_PUBLIC_URL: 'https://motor100.app',
        }) as Record<string, string>
      )[key],
  };

  const service = new InstanceService(
    prisma as any,
    crypto,
    client as unknown as UazapiInstanceClient,
    config as unknown as ConfigService,
  );

  return { service, prisma, client, crypto };
}

describe('InstanceService', () => {
  it('encrypts the UAZAPI token before persisting a new instance', async () => {
    const { service, prisma, client, crypto } = setup();
    client.init.mockResolvedValue({
      instanceName: 'inst-abc',
      token: 'plain-secret-token',
    });
    prisma.channelInstance.create.mockImplementation(({ data }: any) => ({
      id: 'i1',
      createdAt: new Date(),
      phone: null,
      ...data,
    }));

    await service.create({ name: 'Vendas' });

    const persisted = prisma.channelInstance.create.mock.calls[0][0].data;
    expect(persisted.instanceToken).not.toBe('plain-secret-token');
    expect(crypto.decrypt(persisted.instanceToken)).toBe('plain-secret-token');
  });

  it('registers a per-instance webhook using the decrypted token', async () => {
    const { service, prisma, client, crypto } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue({
      id: 'i1',
      serverUrl: 'https://srv.uazapi.com',
      instanceToken: crypto.encrypt('tok-1'),
    });

    await service.registerWebhook('i1');

    expect(client.setWebhook).toHaveBeenCalledWith(
      'https://srv.uazapi.com',
      'tok-1',
      'https://motor100.app/webhook/uazapi/i1',
    );
  });

  it('throws NotFound when registering a webhook for an unknown instance', async () => {
    const { service, prisma } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue(null);

    await expect(service.registerWebhook('missing')).rejects.toThrow(
      /not found/i,
    );
  });

  it('returns the QR code from UAZAPI for connecting an instance', async () => {
    const { service, prisma, client, crypto } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue({
      id: 'i1',
      serverUrl: 'https://srv.uazapi.com',
      instanceToken: crypto.encrypt('tok-1'),
    });
    client.connect.mockResolvedValue({ qrcode: 'data:image/png;base64,AAAA' });

    const qr = await service.getQrCode('i1');

    expect(client.connect).toHaveBeenCalledWith('https://srv.uazapi.com', 'tok-1');
    expect(qr.base64).toBe('data:image/png;base64,AAAA');
  });

  it.each([
    ['connected', 'connected'],
    ['open', 'connected'],
    ['connecting', 'connecting'],
    ['qrcode', 'connecting'],
    ['close', 'disconnected'],
    ['anything-else', 'disconnected'],
  ])('maps UAZAPI status %s → %s', async (raw, expected) => {
    const { service, prisma, client, crypto } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue({
      id: 'i1',
      serverUrl: 'https://srv.uazapi.com',
      instanceToken: crypto.encrypt('tok-1'),
    });
    client.status.mockResolvedValue(raw);

    expect(await service.getStatus('i1')).toBe(expected);
  });

  it('deletes the UAZAPI instance then removes the local row', async () => {
    const { service, prisma, client, crypto } = setup();
    prisma.channelInstance.findUnique.mockResolvedValue({
      id: 'i1',
      serverUrl: 'https://srv.uazapi.com',
      instanceToken: crypto.encrypt('tok-1'),
    });

    await service.remove('i1');

    expect(client.delete).toHaveBeenCalledWith('https://srv.uazapi.com', 'tok-1');
    expect(prisma.channelInstance.delete).toHaveBeenCalledWith({
      where: { id: 'i1' },
    });
  });

  it('lists instances as views without leaking the encrypted token', async () => {
    const { service, prisma } = setup();
    prisma.channelInstance.findMany.mockResolvedValue([
      {
        id: 'i1',
        name: 'Vendas',
        phone: null,
        instanceName: 'inst-abc',
        status: 'connected',
        createdAt: new Date(),
        instanceToken: 'ENCRYPTED',
        webhookSecret: 'SECRET',
        serverUrl: 'https://srv.uazapi.com',
      },
    ]);

    const list = await service.findAll();

    expect(list).toHaveLength(1);
    expect(list[0]).not.toHaveProperty('instanceToken');
    expect(list[0]).not.toHaveProperty('webhookSecret');
    expect(list[0].name).toBe('Vendas');
  });
});
