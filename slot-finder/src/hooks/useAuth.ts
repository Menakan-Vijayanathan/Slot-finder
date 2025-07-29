import { useState, useEffect, useCallback, useRef } from "react";

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

import { config } from '../config';

// Get client ID from config
const CLIENT_ID = config.googleClientId;

// Debug log
console.log('Google Client ID from config:', CLIENT_ID);
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function useAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Add a ref to track if we've already set up the auth state
  const authInitialized = useRef(false);

  const storage = {
    get: async (key: string): Promise<string | null> => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const result = await chrome.storage.local.get(key);
        return result[key] || null;
      }
      return localStorage.getItem(key);
    },
    set: async (key: string, value: string): Promise<void> => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [key]: value });
      } else {
        localStorage.setItem(key, value);
      }
    },
    remove: async (key: string): Promise<void> => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.remove(key);
      } else {
        localStorage.removeItem(key);
      }
    },
  };

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('Checking auth status...');
      const accessToken = await storage.get('google_access_token');
      const expiry = await storage.get('google_token_expiry');
      const refreshToken = await storage.get('google_refresh_token');

      console.log('Auth tokens:', { accessToken, expiry, refreshToken });

      // Check for mock token
      if (accessToken && accessToken.startsWith('dev-token-')) {
        console.log('Found dev token, checking for stored user data...');
        
        // Try to get stored user data first
        const storedUser = await storage.get('google_user');
        let mockUser: GoogleUser;
        
        if (storedUser) {
          console.log('Found stored user data');
          mockUser = JSON.parse(storedUser);
        } else {
          console.log('No stored user data, creating new mock user');
          mockUser = {
            id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
            name: 'Dev User',
            email: 'dev@example.com',
            picture: 'https://ui-avatars.com/api/?name=Dev+User&background=random',
          };
          // Save the mock user for future use
          await storage.set('google_user', JSON.stringify(mockUser));
        }
        
        // Ensure the token is still valid
        const expiry = await storage.get('google_token_expiry');
        if (expiry && Date.now() < Number(expiry)) {
          setUser(mockUser);
          setIsSignedIn(true);
          setToken(accessToken);
          console.log('Mock user signed in');
          return true;
        } else {
          console.log('Mock token expired, signing out...');
          await signOut();
          return false;
        }
      }
      
      if (accessToken && expiry && Date.now() < Number(expiry)) {
        // Token is valid
        console.log('Token is valid, fetching user info...');
        const userInfo = await fetchUserInfo(accessToken);
        console.log('User info:', userInfo);
        if (userInfo) {
          setUser(userInfo);
          setIsSignedIn(true);
          setToken(accessToken);
          console.log('User is signed in');
          return true;
        }
      } else if (refreshToken) {
        console.log('Token expired, attempting refresh...');
        // Try to refresh the token
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          console.log('Token refresh successful');
          return true;
        }
      }
      
      // Clear invalid tokens
      console.log('No valid tokens, signing out...');
      await signOut();
      return false;
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuthError('Failed to check authentication status');
      return false;
    } finally {
      console.log('Auth check complete, setting loading to false');
      setIsLoading(false);
      authInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!authInitialized.current) {
      console.log('Initial auth check');
      checkAuthStatus();
    }
    
    // Set up an interval to check auth status periodically
    const intervalId = setInterval(() => {
      console.log('Periodic auth check');
      checkAuthStatus();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [checkAuthStatus]);

  const fetchUserInfo = async (accessToken: string): Promise<GoogleUser | null> => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setAuthError('Failed to fetch user information');
      return null;
    }
  };

  // Expose a version of refreshAccessToken that can be called without parameters
  const refreshTokenExposed = async (): Promise<string | null> => {
    const refreshToken = await storage.get('google_refresh_token');
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID || '',
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) throw new Error('Failed to refresh token');

      const data = await response.json();
      const expiresIn = data.expires_in * 1000; // Convert to milliseconds
      const expiryTime = Date.now() + expiresIn - 60000; // 1 minute buffer

      await storage.set('google_access_token', data.access_token);
      await storage.set('google_token_expiry', expiryTime.toString());
      
      setToken(data.access_token);
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await signOut();
      return null;
    }
  };

  const refreshAccessToken = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID || '',
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) throw new Error('Failed to refresh token');

      const data = await response.json();
      const expiresIn = data.expires_in * 1000; // Convert to milliseconds
      const expiryTime = Date.now() + expiresIn - 60000; // 1 minute buffer

      await storage.set('google_access_token', data.access_token);
      await storage.set('google_token_expiry', expiryTime.toString());
      
      if (data.refresh_token) {
        await storage.set('google_refresh_token', data.refresh_token);
      }

      setToken(data.access_token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await signOut();
      return false;
    }
  };

  const signIn = async (): Promise<boolean> => {
    try {
      console.log('Starting sign in...');
      setIsLoading(true);
      setAuthError(null);
      
      // Clear any previous auth state
      setUser(null);
      setIsSignedIn(false);
      setToken(null);

      // Clear any existing auth data
      await Promise.all([
        storage.remove('google_access_token'),
        storage.remove('google_refresh_token'),
        storage.remove('google_token_expiry'),
        storage.remove('google_user')
      ]);

      if (typeof chrome !== 'undefined' && chrome.identity) {
        // Chrome extension flow
        const redirectUri = chrome.identity.getRedirectURL('oauth2');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${CLIENT_ID}` +
          `&response_type=code` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&scope=${encodeURIComponent(SCOPES)}` +
          `&access_type=offline` +
          `&prompt=consent`;

        const responseUrl = await new Promise<string>((resolve, reject) => {
          chrome.identity.launchWebAuthFlow(
            { url: authUrl, interactive: true },
            (responseUrl) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(responseUrl || '');
              }
            }
          );
        });

        const url = new URL(responseUrl);
        const code = url.searchParams.get('code');
        
        if (!code) throw new Error('Authorization code not found');

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: CLIENT_ID || '',
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const tokenData = await tokenResponse.json();
        const expiresIn = tokenData.expires_in * 1000; // Convert to milliseconds
        const expiryTime = Date.now() + expiresIn - 60000; // 1 minute buffer

        await storage.set('google_access_token', tokenData.access_token);
        await storage.set('google_token_expiry', expiryTime.toString());
        await storage.set('google_refresh_token', tokenData.refresh_token);

        const userInfo = await fetchUserInfo(tokenData.access_token);
        if (!userInfo) throw new Error('Failed to fetch user info');

        console.log('Sign in successful, updating state...');
        setUser(userInfo);
        setIsSignedIn(true);
        setToken(tokenData.access_token);
        
        // Force a re-render by updating state
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      } else {
        // Web flow for development
        const redirectUri = window.location.origin + '/auth/callback';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${CLIENT_ID}` +
          `&response_type=code` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&scope=${encodeURIComponent(SCOPES)}` +
          `&access_type=offline` +
          `&prompt=consent`;

        // In a real app, you would redirect to authUrl and handle the callback
        // For development, we'll use a mock user
        const mockUser: GoogleUser = {
          id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
          name: 'Dev User',
          email: 'dev@example.com',
          picture: 'https://ui-avatars.com/api/?name=Dev+User&background=random',
        };

        const mockToken = 'dev-token-' + Math.random().toString(36).substr(2);
        const expiryTime = Date.now() + 3600000; // 1 hour from now
        
        console.log('Using mock user for development');
        
        // Update storage first
        await Promise.all([
          storage.set('google_access_token', mockToken),
          storage.set('google_token_expiry', expiryTime.toString()),
          storage.set('google_user', JSON.stringify(mockUser))
        ]);
        
        console.log('Setting mock user and signed in state');
        
        // Force a small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Update state
        setUser(mockUser);
        setIsSignedIn(true);
        setToken(mockToken);
        
        console.log('Sign in complete, isSignedIn should be true');
        
        // Force a re-render by updating state again after a short delay
        setTimeout(() => {
          setUser(prevUser => {
            console.log('Forcing re-render with user:', prevUser);
            return { ...prevUser! };
          });
        }, 100);
        
        return true;
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      setAuthError(error.message || 'Failed to sign in');
      await signOut();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('Starting sign out...');
      
      // Revoke token if possible
      const accessToken = await storage.get('google_access_token');
      if (accessToken) {
        if (accessToken.startsWith('dev-token-')) {
          console.log('Skipping token revocation for dev token');
        } else if (typeof chrome !== 'undefined' && chrome.identity) {
          try {
            console.log('Revoking token...');
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${accessToken}`);
          } catch (error) {
            console.warn('Failed to revoke token:', error);
          }
        }
      }

      // Clear all auth data
      console.log('Clearing auth data from storage...');
      await Promise.all([
        storage.remove('google_access_token'),
        storage.remove('google_refresh_token'),
        storage.remove('google_token_expiry'),
        storage.remove('google_user'),
      ]);

      // Clear state
      console.log('Resetting auth state...');
      setUser(null);
      setIsSignedIn(false);
      setToken(null);
      setAuthError(null);
      
      console.log('Sign out complete');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  return {
    user,
    isSignedIn,
    isLoading,
    error: authError,
    token,
    signIn,
    signOut,
    checkAuthStatus,
    refreshAccessToken: refreshTokenExposed,
  };
}
