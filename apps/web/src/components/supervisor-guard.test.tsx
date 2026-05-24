import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: mockUseAuth,
}));

import { SupervisorGuard } from './supervisor-guard';

describe('SupervisorGuard', () => {
  it('renders children for supervisor role', () => {
    mockUseAuth.mockReturnValue({
      agent: { id: '1', name: 'S', email: 's@s.com', role: 'supervisor' },
    });
    render(
      <SupervisorGuard>
        <div>Admin Panel</div>
      </SupervisorGuard>,
    );
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('renders children for admin role', () => {
    mockUseAuth.mockReturnValue({
      agent: { id: '1', name: 'A', email: 'a@a.com', role: 'admin' },
    });
    render(
      <SupervisorGuard>
        <div>Admin Panel</div>
      </SupervisorGuard>,
    );
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('hides content for attendant role', () => {
    mockUseAuth.mockReturnValue({
      agent: { id: '1', name: 'T', email: 't@t.com', role: 'attendant' },
    });
    render(
      <SupervisorGuard>
        <div>Admin Panel</div>
      </SupervisorGuard>,
    );
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('renders fallback when not authorized', () => {
    mockUseAuth.mockReturnValue({
      agent: { id: '1', name: 'T', email: 't@t.com', role: 'attendant' },
    });
    render(
      <SupervisorGuard fallback={<div>No access</div>}>
        <div>Admin Panel</div>
      </SupervisorGuard>,
    );
    expect(screen.getByText('No access')).toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });
});
