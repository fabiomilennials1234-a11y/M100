import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { Shell } from '@/components/shell';
import { ProtectedRoute } from '@/components/protected-route';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { QueuePage } from '@/pages/queue';
import { WorkspacePage } from '@/pages/workspace';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Shell />}>
                <Route index element={<DashboardPage />} />
                <Route path="queue" element={<QueuePage />} />
                <Route path="conversations/:id" element={<WorkspacePage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
