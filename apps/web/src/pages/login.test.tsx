import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const { mockSignIn, mockAgent } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockAgent: { value: null as null | { id: string; name: string; email: string; role: string } },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    agent: mockAgent.value,
    loading: false,
    token: mockAgent.value ? 'tok' : null,
    signIn: mockSignIn,
    signOut: vi.fn(),
  }),
}));

import { LoginPage } from './login';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAgent.value = null;
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('calls signIn on submit', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);
    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'test@test.com');
    await user.type(screen.getByLabelText('Senha'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'pass123'),
    );
  });

  it('displays error on failed sign in', async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'bad@test.com');
    await user.type(screen.getByLabelText('Senha'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid login credentials',
      ),
    );
  });
});
