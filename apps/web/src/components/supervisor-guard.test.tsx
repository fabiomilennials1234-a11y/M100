import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupervisorGuard } from './supervisor-guard';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('SupervisorGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders children for supervisor role', () => {
    mockUseAuth.mockReturnValue({ agent: { id: 'a1', role: 'supervisor' }, loading: false });
    render(
      <SupervisorGuard>
        <div>Supervisor Content</div>
      </SupervisorGuard>,
    );
    expect(screen.getByText('Supervisor Content')).toBeInTheDocument();
  });

  it('renders children for admin role', () => {
    mockUseAuth.mockReturnValue({ agent: { id: 'a1', role: 'admin' }, loading: false });
    render(
      <SupervisorGuard>
        <div>Admin Content</div>
      </SupervisorGuard>,
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('hides children for attendant role', () => {
    mockUseAuth.mockReturnValue({ agent: { id: 'a1', role: 'attendant' }, loading: false });
    render(
      <SupervisorGuard>
        <div>Hidden Content</div>
      </SupervisorGuard>,
    );
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('renders fallback when provided for attendant', () => {
    mockUseAuth.mockReturnValue({ agent: { id: 'a1', role: 'attendant' }, loading: false });
    render(
      <SupervisorGuard fallback={<div>No access</div>}>
        <div>Hidden</div>
      </SupervisorGuard>,
    );
    expect(screen.getByText('No access')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
