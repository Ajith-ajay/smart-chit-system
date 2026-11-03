import { authApi } from '@/lib/api/auth';
import { checkBackendConnection, clearTokens, getAccessToken } from '@/lib/api/client';
import { User } from '@/types';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface BackendHealth {
  isOnline: boolean | null;
  isChecking: boolean;
  error?: string;
  lastChecked?: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  backendHealth: BackendHealth;
  checkBackendHealth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({
    isOnline: null,
    isChecking: true,
  });

  console.log(
    'AuthProvider rendered. User:',
    user,
    'isLoading:',
    isLoading,
    'backendHealth:',
    backendHealth,
  );

  const checkBackendHealth = useCallback(async () => {
    setBackendHealth((prev) => ({ ...prev, isChecking: true }));
    const result = await checkBackendConnection();
    setBackendHealth({
      isOnline: result.isOnline,
      isChecking: false,
      error: result.error,
      lastChecked: new Date(),
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      // If /auth/me fails, keep tokens if server is offline, or clear if 401
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    refreshUser();

    const handleAuthExpired = () => {
      setUser(null);
      clearTokens();
    };

    window.addEventListener('scms:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('scms:auth-expired', handleAuthExpired);
    };
  }, [checkBackendHealth, refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.user);
      setBackendHealth({
        isOnline: true,
        isChecking: false,
        lastChecked: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      clearTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        backendHealth,
        checkBackendHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
