import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'attendant' | 'supervisor' | 'admin';
}

interface AuthContextValue {
  agent: Agent | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(accessToken: string): Promise<Agent> {
  const res = await fetch('/api/auth/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const profile = await fetchProfile(session.access_token);
          setAgent(profile);
          setToken(session.access_token);
        } catch {
          setAgent(null);
          setToken(null);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        try {
          const profile = await fetchProfile(session.access_token);
          setAgent(profile);
          setToken(session.access_token);
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('No session returned');
    const profile = await fetchProfile(data.session.access_token);
    setAgent(profile);
    setToken(data.session.access_token);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAgent(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ agent, loading, signIn, signOut, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
