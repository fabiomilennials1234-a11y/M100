import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockSignInWithPassword, mockSignOut, mockGetSession, mockOnAuthStateChange } =
  vi.hoisted(() => ({
    mockSignInWithPassword: vi.fn(),
    mockSignOut: vi.fn(),
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
  }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiFetch: mockApiFetch,
}));

import { AuthProvider, useAuth } from './use-auth';

function TestConsumer() {
  const { agent, loading, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="agent">{agent ? agent.name : 'null'}</span>
      <button onClick={() => signIn('a@b.com', '123')}>sign-in</button>
      <button onClick={() => signOut()}>sign-out</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('starts in loading state', () => {
    renderWithProvider();
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('signs in and fetches profile', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'tok123' } },
      error: null,
    });
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ id: '1', name: 'Ana', email: 'a@b.com', role: 'attendant' }),
    });

    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );
    await user.click(screen.getByText('sign-in'));
    await waitFor(() =>
      expect(screen.getByTestId('agent')).toHaveTextContent('Ana'),
    );
  });

  it('shows error for invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: new Error('Invalid login credentials'),
    });

    let capturedSignIn: ((email: string, password: string) => Promise<void>) | null = null;

    function Capture() {
      const { signIn } = useAuth();
      capturedSignIn = signIn;
      return null;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    );

    await expect(capturedSignIn!('a@b.com', '123')).rejects.toThrow(
      'Invalid login credentials',
    );
  });

  it('signs out', async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'tok123' } },
      error: null,
    });
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ id: '1', name: 'Ana', email: 'a@b.com', role: 'attendant' }),
    });
    mockSignOut.mockResolvedValue({});

    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false'),
    );
    await user.click(screen.getByText('sign-in'));
    await waitFor(() =>
      expect(screen.getByTestId('agent')).toHaveTextContent('Ana'),
    );
    await user.click(screen.getByText('sign-out'));
    await waitFor(() =>
      expect(screen.getByTestId('agent')).toHaveTextContent('null'),
    );
  });

  it('restores session on mount', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'restored-tok' } },
    });
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ id: '2', name: 'Carlos', email: 'c@d.com', role: 'supervisor' }),
    });

    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('agent')).toHaveTextContent('Carlos'),
    );
    expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/profile', 'restored-tok', { method: 'POST' });
  });
});
