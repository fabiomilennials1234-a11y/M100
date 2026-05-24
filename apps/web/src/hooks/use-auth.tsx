import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  agent: Agent | null;
  loading: boolean;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(token: string): Promise<Agent> {
  const res = await apiFetch('/api/auth/profile', token, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) {
        try {
          const profile = await fetchProfile(session.access_token);
          setToken(session.access_token);
          setAgent(profile);
        } catch {
          setAgent(null);
          setToken(null);
        }
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        try {
          const profile = await fetchProfile(session.access_token);
          setToken(session.access_token);
          setAgent(profile);
        } catch {
          setAgent(null);
          setToken(null);
        }
      } else {
        setAgent(null);
        setToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const accessToken = data.session.access_token;
    const profile = await fetchProfile(accessToken);
    setToken(accessToken);
    setAgent(profile);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAgent(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ agent, loading, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
