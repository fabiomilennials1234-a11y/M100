import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './login';

const mockSignIn = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      agent: null,
      loading: false,
      signIn: mockSignIn,
      signOut: vi.fn(),
      token: null,
    });
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('calls signIn with form values on submit', async () => {
    mockSignIn.mockResolvedValue(undefined);
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'joao@m100.com');
    await user.type(screen.getByLabelText(/senha/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(mockSignIn).toHaveBeenCalledWith('joao@m100.com', 'senha123');
  });

  it('shows error message on failed login', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'bad@email.com');
    await user.type(screen.getByLabelText(/senha/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid login credentials/i);
    });
  });
});
