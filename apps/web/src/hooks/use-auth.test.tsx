import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth, AuthProvider } from './use-auth';
import type { ReactNode } from 'react';

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('starts with loading true and no agent', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.agent).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('signs in with email/password and fetches agent profile', async () => {
    const session = { access_token: 'tok-123' };
    mockSignIn.mockResolvedValue({ data: { session }, error: null });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'agent-1', name: 'João', role: 'attendant' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn('joao@m100.com', 'senha123');
    });

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'joao@m100.com',
      password: 'senha123',
    });
    expect(result.current.agent).toEqual(
      expect.objectContaining({ id: 'agent-1', role: 'attendant' }),
    );
  });

  it('sign in throws on invalid credentials', async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(() => result.current.signIn('bad@email.com', 'wrong')),
    ).rejects.toThrow('Invalid login credentials');
  });

  it('signs out and clears agent', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const session = { access_token: 'tok-123' };
    mockSignIn.mockResolvedValue({ data: { session }, error: null });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'agent-1', name: 'João', role: 'attendant' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.signIn('joao@m100.com', 'senha123'));
    expect(result.current.agent).not.toBeNull();

    await act(() => result.current.signOut());
    expect(result.current.agent).toBeNull();
  });

  it('restores session on mount if existing session', async () => {
    const session = { access_token: 'existing-tok' };
    mockGetSession.mockResolvedValue({ data: { session }, error: null });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'agent-1', name: 'João', role: 'supervisor' }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.agent).toEqual(
      expect.objectContaining({ id: 'agent-1', role: 'supervisor' }),
    );
  });
});
