import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isAuthenticated,
    user,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token,
    login,
    register,
    logout,
    loading,
    error,
    clearError
  } = useAuthStore();

  // Check token on initial load
  useEffect(() => {
    // This function is intentionally empty since token persistence is handled by zustand
    // We keep the effect to potentially add token validation in the future
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    register,
    logout,
    loading,
    error,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; 