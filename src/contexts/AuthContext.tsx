import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'user' | 'weekly_collector' | 'spot_collector' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city: string;
  street: string;
  address: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  signup: (data: Partial<User> & { password: string }) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, _password: string, role: UserRole) => {
    setUser({
      id: '1',
      name: 'John Doe',
      email,
      role,
      city: 'Vijayawada',
      street: 'Street 3',
      address: '123 Main Road',
      phone: '9876543210',
    });
  };

  const signup = (data: Partial<User> & { password: string }) => {
    setUser({
      id: '1',
      name: data.name || '',
      email: data.email || '',
      role: 'user',
      city: data.city || 'Vijayawada',
      street: data.street || '',
      address: data.address || '',
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
