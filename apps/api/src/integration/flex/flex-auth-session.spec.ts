import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FlexAuthSession } from './flex-auth-session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeSession() {
  const config = {
    get: (key: string) =>
      (
        ({
          FLEX_BASE_URL: 'http://flex.local:8080',
          FLEX_USERNAME: 'motor100',
          FLEX_PASSWORD: 'secret',
        }) as Record<string, string>
      )[key],
  } as unknown as ConfigService;
  return new FlexAuthSession(config);
}

const loginResponse = {
  data: {
    access_token: 'ACCESS-1',
    expires_at: 'Sun Nov 24 12:10:11 BRT 2099',
    cd_usuario: 1,
    filial: 1,
  },
};

describe('FlexAuthSession', () => {
  afterEach(() => jest.clearAllMocks());

  it('logs in and returns the access token', async () => {
    const session = makeSession();
    mockedAxios.post.mockResolvedValueOnce(loginResponse);

    const token = await session.getToken();

    expect(token).toBe('ACCESS-1');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://flex.local:8080/login',
      { username: 'motor100', password: 'secret' },
      { headers: { 'Content-Type': 'application/json' } },
    );
  });

  it('caches the token across calls instead of logging in every time', async () => {
    const session = makeSession();
    mockedAxios.post.mockResolvedValue(loginResponse);

    await session.getToken();
    await session.getToken();

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('re-logs in after the session is invalidated (e.g. on 401)', async () => {
    const session = makeSession();
    mockedAxios.post.mockResolvedValue(loginResponse);

    await session.getToken();
    session.invalidate();
    await session.getToken();

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('uses a fallback TTL when expires_at is unparseable (no throw)', async () => {
    const session = makeSession();
    mockedAxios.post.mockResolvedValue({
      data: { access_token: 'A', expires_at: 'not-a-date' },
    });

    expect(await session.getToken()).toBe('A');
  });

  it('serves the cached token until expiry, then re-logs in', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2099-01-01T00:00:00Z'));
    const session = makeSession();
    // expires 120s ahead → minus 60s skew → effectively valid for ~60s
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: 'A',
        expires_at: new Date('2099-01-01T00:02:00Z').toISOString(),
      },
    });

    await session.getToken(); // login #1

    jest.setSystemTime(new Date('2099-01-01T00:00:30Z')); // 30s → still cached
    await session.getToken();
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date('2099-01-01T00:01:30Z')); // 90s → past skewed expiry
    await session.getToken();
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});
