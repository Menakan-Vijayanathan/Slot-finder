import { useState } from "react";

export function useWebAuth() {
  // Always signed in as a dummy user for demo
  const [user] = useState({
    id: "demo",
    name: "Demo User",
    email: "demo@example.com",
    picture: "https://ui-avatars.com/api/?name=Demo+User",
  });
  const [isSignedIn] = useState(true);
  const [isLoading] = useState(false);

  return {
    user,
    isSignedIn,
    isLoading,
    signIn: () => {},
    signOut: () => {},
  };
}
