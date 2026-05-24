import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiFetch: mockApiFetch,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    agent: { id: '1', name: 'Test', email: 't@t.com', role: 'attendant' },
    loading: false,
    token: 'test-token',
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

import { QueuePage } from './queue';

function renderQueue() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <QueuePage />
    </QueryClientProvider>,
  );
}

const conversations = [
  {
    id: 'c1',
    phone: '+5511999990001',
    progressiveSummary: 'Cliente quer saber sobre entregas',
    createdAt: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: 'c2',
    phone: '+5511999990002',
    progressiveSummary: null,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

describe('QueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of conversations', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(conversations),
    });
    renderQueue();
    await waitFor(() => {
      expect(screen.getByText('+5511999990001')).toBeInTheDocument();
      expect(screen.getByText('+5511999990002')).toBeInTheDocument();
    });
  });

  it('shows progressive summary when available', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(conversations),
    });
    renderQueue();
    await waitFor(() =>
      expect(
        screen.getByText('Cliente quer saber sobre entregas'),
      ).toBeInTheDocument(),
    );
  });

  it('calls assign endpoint on Atender click', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(conversations),
    });
    renderQueue();
    await waitFor(() => screen.getByText('+5511999990001'));
    const buttons = screen.getAllByText('Atender');
    await user.click(buttons[0]);
    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/conversations/c1/assign',
        'test-token',
        { method: 'POST' },
      ),
    );
  });

  it('shows empty state when no conversations', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderQueue();
    await waitFor(() =>
      expect(
        screen.getByText('Nenhuma conversa na fila'),
      ).toBeInTheDocument(),
    );
  });
});
