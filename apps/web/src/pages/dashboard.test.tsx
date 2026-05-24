import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './dashboard';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ token: 'tok-123', agent: { id: 'a1', role: 'attendant' } }),
}));

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
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          active: 42,
          queued: 7,
          aiHandled: 25,
          humanHandled: 10,
          closedToday: 18,
        }),
    });
  });

  it('renders 5 metric cards with data from API', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    renderDashboard();

    expect(screen.getAllByTestId('metric-skeleton').length).toBeGreaterThanOrEqual(5);
  });

  it('fetches from /api/metrics with auth header', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/metrics',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer tok-123',
          }),
        }),
      );
    });
  });
});
