import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

import { WorkspacePage } from './workspace';

const conversation = {
  id: 'conv-1',
  phone: '+5511999990001',
  status: 'atendida_por_humano',
  progressiveSummary: 'Cliente perguntou sobre preços',
  agent: { name: 'João' },
};

const messages = [
  { id: 'm1', content: 'Olá, preciso de ajuda', direction: 'inbound', createdAt: new Date().toISOString() },
  { id: 'm2', content: 'Como posso ajudar?', direction: 'outbound', createdAt: new Date().toISOString() },
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
    mockApiFetch.mockImplementation((path: string) => {
      if (path.includes('/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(messages),
        });
      }
      if (path.includes('/conversations/conv-1') && !path.includes('/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(conversation),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(conversation),
      });
    });
  });

  it('renders conversation header with phone and status', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('+5511999990001')).toBeInTheDocument();
      expect(screen.getByText('Humano')).toBeInTheDocument();
    });
  });

  it('renders messages with correct alignment', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('Olá, preciso de ajuda')).toBeInTheDocument();
      expect(screen.getByText('Como posso ajudar?')).toBeInTheDocument();
    });
  });

  it('sends a message on form submit', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await waitFor(() => screen.getByText('Olá, preciso de ajuda'));
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    await user.type(input, 'Nova mensagem');
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/conversations/conv-1/messages',
        'test-token',
        {
          method: 'POST',
          body: JSON.stringify({ content: 'Nova mensagem' }),
        },
      ),
    );
  });

  it('has action buttons for return-to-ai and close', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('Devolver para IA')).toBeInTheDocument();
      expect(screen.getByText('Encerrar')).toBeInTheDocument();
    });
  });

  it('shows context panel with summary and agent', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(
        screen.getByText('Cliente perguntou sobre preços'),
      ).toBeInTheDocument();
      expect(screen.getByText('Agente: João')).toBeInTheDocument();
    });
  });
});
