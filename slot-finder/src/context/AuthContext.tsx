import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={{
      user: auth.user,
      isSignedIn: auth.isSignedIn,
      isLoading: auth.isLoading,
      error: auth.error,
      token: auth.token,
      signIn: auth.signIn,
      signOut: auth.signOut,
      checkAuthStatus: auth.checkAuthStatus,
      refreshToken: auth.refreshAccessToken || (async () => null)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
