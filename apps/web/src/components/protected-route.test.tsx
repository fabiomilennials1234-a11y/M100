import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: mockUseAuth,
}));

import { ProtectedRoute } from './protected-route';

function renderRoute() {
  return render(
    <MemoryRouter>
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when no agent', () => {
    mockUseAuth.mockReturnValue({ agent: null, loading: false });
    renderRoute();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when agent exists', () => {
    mockUseAuth.mockReturnValue({
      agent: { id: '1', name: 'Test', email: 't@t.com', role: 'attendant' },
      loading: false,
    });
    renderRoute();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading spinner while loading', () => {
    mockUseAuth.mockReturnValue({ agent: null, loading: true });
    const { container } = renderRoute();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
