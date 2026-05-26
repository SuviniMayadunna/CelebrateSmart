import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, getAuthToken, removeAuthToken } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  /** True while we are verifying a stored token on initial load */
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: 'customer' | 'admin') => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<Pick<AuthUser, 'name' | 'phone'>>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On mount – if a JWT is stored, verify it with the backend and
   * restore the user session, otherwise clear any stale token.
   */
  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    authAPI
      .getCurrentUser()
      .then((res) => {
        setUser(res.data.user as AuthUser);
      })
      .catch(() => {
        // Token is invalid / expired – remove it
        removeAuthToken();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = async (
    email: string,
    password: string,
    role: 'customer' | 'admin'
  ): Promise<void> => {
    const res = await authAPI.login({ email, password, role });
    setUser(res.data.user as AuthUser);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string
  ): Promise<void> => {
    const res = await authAPI.register({ name, email, password, phone });
    setUser(res.data.user as AuthUser);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const updateUser = (updates: Partial<Pick<AuthUser, 'name' | 'phone'>>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
