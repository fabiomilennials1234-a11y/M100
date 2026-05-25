import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  const { agent, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (agent) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Motor100</h1>
          <p className="text-sm text-muted-foreground">Agent Workspace</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Motor100 &copy; {new Date().getFullYear()}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
