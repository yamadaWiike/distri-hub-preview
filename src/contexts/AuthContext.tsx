import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  email: string;
  namaBisnis?: string;
  kota?: string;
  role?: 'user' | 'admin';
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; namaBisnis: string; alamatLengkap: string; kota: string; namaPemilik: string; kontakPemilik: string; }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('baskit_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    // TEMP: Local auth until Supabase client is available
    const mockUser: User = { email, role: email.endsWith('@baskit.app') ? 'admin' : 'user' };
    localStorage.setItem('baskit_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const register = async (data: { email: string; password: string; namaBisnis: string; alamatLengkap: string; kota: string; namaPemilik: string; kontakPemilik: string; }) => {
    const mockUser: User = { email: data.email, namaBisnis: data.namaBisnis, kota: data.kota, role: 'user' };
    localStorage.setItem('baskit_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('baskit_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
