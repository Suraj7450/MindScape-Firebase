
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';

/**
 * An authentication form component for user sign-in and sign-up.
 * It handles email/password authentication with Firebase, including user profile updates.
 * @returns {JSX.Element} The authentication form component.
 */
export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  /**
   * Handles the form submission for both sign-in and sign-up.
   * If a user tries to sign in but doesn't exist, it automatically switches to sign-up mode.
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (username) {
          await updateProfile(userCredential.user, { displayName: username });
        }
        toast({ title: 'Account created successfully!' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Welcome back!' });
      }
      router.back();
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' && !isSignUp) {
        setIsSignUp(true);
        toast({ title: 'New user detected', description: 'Creating account...' });
        // Don't setIsLoading(false) here, to allow immediate retry
        return; 
      }
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign up failed' : 'Sign in failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Card className="glassmorphism">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                disabled={isLoading}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
          {!isSignUp && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(true)}
            >
              Need an account? Sign up
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
