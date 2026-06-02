import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock('@/lib/api', () => ({ apiFetch: mockApiFetch }));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    agent: { id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' },
    loading: false,
    token: 'test-token',
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { SettingsPage } from './settings';

const instances = [
  {
    id: 'i1',
    name: 'Vendas',
    phone: '+5511999990001',
    instanceName: 'inst-vendas',
    status: 'disconnected',
    createdAt: new Date().toISOString(),
  },
];

function mockEndpoints(list: unknown[]) {
  mockApiFetch.mockImplementation((path: string) => {
    if (path === '/api/instances')
      return Promise.resolve({ ok: true, json: () => Promise.resolve(list) });
    if (path.endsWith('/status'))
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'connected' }),
      });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists connected instances', async () => {
    mockEndpoints(instances);
    renderSettings();
    await waitFor(() => expect(screen.getByText('Vendas')).toBeInTheDocument());
    expect(screen.getByText('+5511999990001')).toBeInTheDocument();
  });

  it('shows empty state when there are no instances', async () => {
    mockEndpoints([]);
    renderSettings();
    await waitFor(() =>
      expect(screen.getByText('Nenhum número conectado')).toBeInTheDocument(),
    );
  });

  it('opens the connect dialog from the header button', async () => {
    const user = userEvent.setup();
    mockEndpoints(instances);
    renderSettings();
    await waitFor(() => screen.getByText('Vendas'));

    await user.click(screen.getByRole('button', { name: 'Conectar número' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Gerar QR Code/ }),
      ).toBeInTheDocument(),
    );
  });

  it('creates an instance and requests its QR code', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockImplementation((path: string, _t: string, init?: RequestInit) => {
      if (path === '/api/instances' && init?.method === 'POST')
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'i9', name: 'Suporte' }),
        });
      if (path === '/api/instances')
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (path.endsWith('/qr'))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ base64: 'data:image/png;base64,AAAA' }),
        });
      if (path.endsWith('/status'))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'connecting' }),
        });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    renderSettings();
    await waitFor(() => screen.getByText('Nenhum número conectado'));

    await user.click(screen.getAllByRole('button', { name: 'Conectar número' })[0]);
    await user.type(screen.getByLabelText('Nome'), 'Suporte');
    await user.click(screen.getByRole('button', { name: /Gerar QR Code/ }));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/instances/i9/qr',
        'test-token',
      ),
    );
  });
});
