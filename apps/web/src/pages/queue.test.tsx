import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueuePage } from './queue';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    token: 'tok-123',
    agent: { id: 'agent-1', name: 'João', role: 'attendant' },
  }),
}));

function renderQueue() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <QueuePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const conversations = [
  {
    id: 'conv-1',
    externalPhone: '+5511999990001',
    status: 'na_fila',
    ownerType: 'queue',
    updatedAt: '2026-05-24T10:00:00Z',
    progressiveSummary: 'Cliente perguntou sobre preço',
  },
  {
    id: 'conv-2',
    externalPhone: '+5511999990002',
    status: 'na_fila',
    ownerType: 'queue',
    updatedAt: '2026-05-24T09:30:00Z',
    progressiveSummary: null,
  },
];

describe('QueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(conversations),
    });
  });

  it('renders list of queued conversations', async () => {
    renderQueue();

    await waitFor(() => {
      expect(screen.getByText('+5511999990001')).toBeInTheDocument();
    });
    expect(screen.getByText('+5511999990002')).toBeInTheDocument();
  });

  it('shows progressive summary when available', async () => {
    renderQueue();

    await waitFor(() => {
      expect(screen.getByText('Cliente perguntou sobre preço')).toBeInTheDocument();
    });
  });

  it('claims conversation on button click', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(conversations) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'conv-1', status: 'atendida_humano' }) });

    renderQueue();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('+5511999990001')).toBeInTheDocument();
    });

    const claimButtons = screen.getAllByRole('button', { name: /atender/i });
    await user.click(claimButtons[0]);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/conversations/conv-1/assign',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows empty state when no queued conversations', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    renderQueue();

    await waitFor(() => {
      expect(screen.getByText(/nenhuma conversa na fila/i)).toBeInTheDocument();
    });
  });
});
