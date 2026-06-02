import axios from 'axios';
import { UazapiInstanceClient } from './uazapi-instance.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UazapiInstanceClient', () => {
  const client = new UazapiInstanceClient();

  afterEach(() => jest.clearAllMocks());

  it('creates an instance with the admin token and returns its name + token', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { instance: { name: 'inst-xyz', token: 'instance-token-1' } },
    });

    const result = await client.init(
      'https://srv.uazapi.com',
      'admin-token',
      'Vendas',
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://srv.uazapi.com/instance/init',
      { name: 'Vendas' },
      { headers: { admintoken: 'admin-token' } },
    );
    expect(result).toEqual({
      instanceName: 'inst-xyz',
      token: 'instance-token-1',
    });
  });

  it('connects with the instance token and extracts the QR code', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { instance: { qrcode: 'base64-qr' } },
    });

    const result = await client.connect('https://srv.uazapi.com', 'tok-1');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://srv.uazapi.com/instance/connect',
      {},
      { headers: { token: 'tok-1' } },
    );
    expect(result.qrcode).toBe('base64-qr');
  });
});
