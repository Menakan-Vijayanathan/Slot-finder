import { useState, useEffect } from "react";

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export function useAuth() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if Chrome extension API is available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const token = await chrome.storage.local.get(["google_access_token"]);
        if (token.google_access_token) {
          const userInfo = await fetchUserInfo(token.google_access_token);
          if (userInfo) {
            setUser(userInfo);
            setIsSignedIn(true);
          }
        }
      } else {
        // Fallback for development - check localStorage
        const token = localStorage.getItem("google_access_token");
        if (token) {
          const userInfo = await fetchUserInfo(token);
          if (userInfo) {
            setUser(userInfo);
            setIsSignedIn(true);
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async (
    accessToken: string
  ): Promise<GoogleUser | null> => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
    return null;
  };

  const signIn = async () => {
    try {
      setIsLoading(true);

      if (typeof chrome !== 'undefined' && chrome.identity && chrome.storage && chrome.storage.local) {
        const token = await chrome.identity.getAuthToken({
          interactive: true,
          scopes: [
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/userinfo.profile",
          ],
        });

        if (token) {
          await chrome.storage.local.set({ google_access_token: token });

          const userInfo = await fetchUserInfo(token);
          if (userInfo) {
            setUser(userInfo);
            setIsSignedIn(true);
          }
        }
      } else {
        // Fallback for development - mock user
        const mockUser: GoogleUser = {
          id: "dev-user",
          name: "Dev User",
          email: "dev@example.com",
          picture: "https://via.placeholder.com/32"
        };
        setUser(mockUser);
        setIsSignedIn(true);
        localStorage.setItem("google_access_token", "dev-token");
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.identity && chrome.storage && chrome.storage.local) {
        const token = await chrome.storage.local.get(["google_access_token"]);
        if (token.google_access_token) {
          await chrome.identity.removeCachedAuthToken({
            token: token.google_access_token,
          });
        }

        await chrome.storage.local.remove(["google_access_token"]);
      } else {
        // Fallback for development
        localStorage.removeItem("google_access_token");
      }
      
      setUser(null);
      setIsSignedIn(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return {
    user,
    isSignedIn,
    isLoading,
    signIn,
    signOut,
  };
}
