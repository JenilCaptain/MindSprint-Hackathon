"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = () => {
      const token = apiClient.getToken();
      console.log('Auth init - Token found:', !!token);
      if (token) {
        // Here you might want to validate the token with the server
        // For now, we'll just check if the token exists
        try {
          // You could decode the JWT to get user info
          // For now, we'll just set a basic user state
          const savedUser = localStorage.getItem('user');
          console.log('Auth init - Saved user:', savedUser);
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            console.log('Auth init - Parsed user data:', userData);
            setUser(userData);
          }
        } catch (error) {
          console.error('Error parsing saved user:', error);
          apiClient.removeToken();
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login({ email, password });
      console.log('Login response:', response);
      const userData = {
        _id: response._id,
        name: response.name,
        email: response.email,
      };
      console.log('Setting user data:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.register({ name, email, password });
      const userData = {
        _id: response._id,
        name: response.name,
        email: response.email,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      router.push('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiClient.logout();
    localStorage.removeItem('user');
    router.push('/');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
