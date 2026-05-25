import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockAgent, mockSignOut, mockToggleTheme, mockTheme } = vi.hoisted(() => ({
  mockAgent: { id: '1', name: 'João', email: 'j@m.com', role: 'attendant' },
  mockSignOut: vi.fn(),
  mockToggleTheme: vi.fn(),
  mockTheme: { value: 'dark' as string },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    agent: mockAgent,
    loading: false,
    token: 'tok',
    signIn: vi.fn(),
    signOut: mockSignOut,
  }),
}));

vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ theme: mockTheme.value, toggleTheme: mockToggleTheme }),
}));

import { Shell } from './shell';

function renderShell(route = '/') {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <Shell />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme.value = 'dark';
  });

  it('renders navigation links', () => {
    renderShell();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Fila')).toBeInTheDocument();
    expect(screen.getByText('Conversas')).toBeInTheDocument();
    expect(screen.getAllByText('Motor100').length).toBeGreaterThan(0);
  });

  it('highlights active link', () => {
    renderShell('/');
    const dashSpan = screen.getByText('Dashboard').closest('[data-active]');
    expect(dashSpan).toHaveAttribute('data-active', 'true');
  });

  it('toggles theme on button click', () => {
    renderShell();
    const btn = screen.getByLabelText('Toggle theme');
    fireEvent.click(btn);
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('renders outlet area for child routes', () => {
    renderShell();
    // Outlet renders — main exists
    expect(document.querySelector('main')).toBeInTheDocument();
  });
});
