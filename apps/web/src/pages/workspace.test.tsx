import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspacePage } from './workspace';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    token: 'tok-123',
    agent: { id: 'agent-1', name: 'João', role: 'attendant' },
  }),
}));

const conversation = {
  id: 'conv-1',
  externalPhone: '+5511999990001',
  status: 'atendida_humano',
  ownerType: 'agent',
  agentId: 'agent-1',
  progressiveSummary: 'Cliente quer saber prazo',
  agent: { id: 'agent-1', name: 'João' },
};

const messages = [
  { id: 'msg-1', content: 'Oi, qual o prazo?', sender: 'customer', direction: 'inbound', createdAt: '2026-05-24T10:00:00Z' },
  { id: 'msg-2', content: 'Olá! O prazo é 5 dias.', sender: 'agent', direction: 'outbound', createdAt: '2026-05-24T10:01:00Z' },
];

function renderWorkspace() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/conversations/conv-1']}>
        <Routes>
          <Route path="/conversations/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('WorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(conversation) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(messages) });
  });

  it('renders conversation header with phone number', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('+5511999990001')).toBeInTheDocument();
    });
  });

  it('renders message list with correct alignment', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('Oi, qual o prazo?')).toBeInTheDocument();
    });
    expect(screen.getByText('Olá! O prazo é 5 dias.')).toBeInTheDocument();
  });

  it('sends message via input form', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'msg-3' }) });

    renderWorkspace();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('Oi, qual o prazo?')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/digite.*mensagem/i);
    await user.type(input, 'Obrigado!');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/conversations/conv-1/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Obrigado!' }),
        }),
      );
    });
  });

  it('shows close and return-to-ai action buttons', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /encerrar/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /devolver.*ia/i })).toBeInTheDocument();
  });

  it('shows context panel with progressive summary', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('Cliente quer saber prazo')).toBeInTheDocument();
    });
  });
});
