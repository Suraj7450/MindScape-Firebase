
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { Icons } from '@/components/icons';

/**
 * Enhanced authentication form with premium styling
 */
export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: 'Welcome back!' });
      router.back();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google sign in failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Reset email sent',
        description: 'Check your email for the password reset link.'
      });
      setIsResettingPassword(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Dark Card - Matching Reference */}
      <div className="relative bg-[#1a1a3e]/80 backdrop-blur-xl border border-indigo-900/30 rounded-3xl shadow-2xl overflow-hidden p-10">

        <div className="relative">
          {isResettingPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-sm text-indigo-300/60">Enter your email to receive a reset link</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-200/80">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={isLoading}
                  required
                  className="h-14 bg-[#0f0f23]/50 border-indigo-800/40 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 text-white placeholder:text-indigo-400/40 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Send Reset Link
              </Button>

              <button
                type="button"
                onClick={() => setIsResettingPassword(false)}
                className="w-full text-sm text-indigo-300 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>
                {isSignUp && (
                  <p className="text-sm text-indigo-300/60">Start visualizing your knowledge</p>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-indigo-200/80">Username</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    disabled={isLoading}
                    className="h-14 bg-[#0f0f23]/50 border-indigo-800/40 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 text-white placeholder:text-indigo-400/40 rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-200/80">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={isLoading}
                  required
                  className="h-14 bg-[#0f0f23]/50 border-indigo-800/40 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 text-white placeholder:text-indigo-400/40 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-indigo-200/80">Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setIsResettingPassword(true)}
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="h-14 bg-[#0f0f23]/50 border-indigo-800/40 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 text-white placeholder:text-indigo-400/40 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-indigo-800/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1a1a3e] px-3 text-indigo-400/60">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-14 bg-[#0f0f23]/50 border-indigo-800/40 hover:bg-[#0f0f23]/80 hover:border-indigo-700/50 text-white rounded-xl"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-5 w-5" />
                )}
                Google
              </Button>

              {/* Feature Badges at Bottom */}
              <div className="flex items-center justify-center gap-4 text-xs text-indigo-400/60 pt-4">
                <span>Secure</span>
                <span>•</span>
                <span>Private</span>
              </div>

              {!isSignUp && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-sm text-indigo-300 hover:text-white transition-colors"
                  >
                    Don't have an account? <span className="font-semibold text-violet-400">Sign up</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );

  <div className="relative p-8">
    {isResettingPassword ? (
      <form onSubmit={handleResetPassword} className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-sm text-zinc-400">Enter your email to receive a reset link</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading}
            required
            className="h-12 bg-zinc-800/50 border-zinc-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium shadow-lg shadow-violet-500/30"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Send Reset Link
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full h-12 text-zinc-400 hover:text-white hover:bg-white/5"
          onClick={() => setIsResettingPassword(false)}
          disabled={isLoading}
        >
          Back to Login
        </Button>
      </form>
    ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-zinc-400">
            {isSignUp ? 'Start visualizing your knowledge' : 'Continue your learning journey'}
          </p>
        </div>

        {isSignUp && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Username</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isLoading}
              className="h-12 bg-zinc-800/50 border-zinc-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white placeholder:text-zinc-500"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={isLoading}
            required
            className="h-12 bg-zinc-800/50 border-zinc-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => setIsResettingPassword(true)}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            required
            minLength={6}
            className="h-12 bg-zinc-800/50 border-zinc-700/50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-white placeholder:text-zinc-500"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium shadow-lg shadow-violet-500/30 transition-all"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900/60 px-3 text-zinc-500">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600 text-white transition-all"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-5 w-5" />
          )}
          Google
        </Button>

        {!isSignUp && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
            >
              Need an account? <span className="font-medium">Sign up</span>
            </button>
          </div>
        )}
      </form>
    )}
  </div>
      </div >
    </div >
  );
}
