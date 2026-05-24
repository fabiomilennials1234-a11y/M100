import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div />,
}));

import { DashboardPage } from './dashboard';

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders metric cards with data', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          active: 15,
          queued: 3,
          aiHandled: 42,
          humanHandled: 8,
          closedToday: 20,
        }),
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  it('shows skeleton while loading', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    renderDashboard();
    expect(screen.getAllByTestId('metric-skeleton').length).toBeGreaterThan(0);
  });

  it('sends auth header in API call', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          active: 0,
          queued: 0,
          aiHandled: 0,
          humanHandled: 0,
          closedToday: 0,
        }),
    });
    renderDashboard();
    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith('/api/metrics', 'test-token'),
    );
  });
});
