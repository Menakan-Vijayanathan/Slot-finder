import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useAuthContext } from '../context/AuthContext';

export const SignInButton: React.FC = () => {
  const { signIn, isLoading, isSignedIn, user } = useAuthContext();
  const [isClient, setIsClient] = useState(false);

  // Ensure this only runs on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignInClick = async () => {
    console.log('Sign in button clicked');
    try {
      const success = await signIn();
      console.log('Sign in result:', { success, isSignedIn, user });
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  if (!isClient) {
    return null; // Don't render anything during SSR
  }

  if (isLoading) {
    return (
      <Button disabled variant="ghost" size="icon" type="button">
        <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </Button>
    );
  }

  if (isSignedIn) {
    return null; // Don't show sign in button if already signed in
  }

  return (
    <Button 
      variant="default" 
      onClick={handleSignInClick}
      className="bg-blue-600 hover:bg-blue-700 text-white"
      disabled={isLoading}
    >
      {isLoading ? 'Signing in...' : 'Sign In'}
    </Button>
  );
};

export default SignInButton;
