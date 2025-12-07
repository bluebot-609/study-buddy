'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/app/providers/auth-provider';
import Link from 'next/link';

export default function SignupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && user) {
      // If already logged in, redirect to documents
      router.push('/documents');
    }
  }, [user, authLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/documents`,
        },
      });

      if (error) throw error;

      // Show success message about email confirmation
      setSuccess(true);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>

        {/* Main content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <Link href="/" className="inline-block mb-8">
                <h1 className="text-3xl font-bold text-foreground">Study Buddy</h1>
              </Link>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Create your account
              </h2>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleSignup}>
          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 dark:bg-green-500/10 dark:border-green-500/20 p-4">
              <div className="text-sm text-green-600 dark:text-green-400">
                <p className="font-medium mb-1">Account created successfully!</p>
                <p>We&apos;ve sent a confirmation link to <strong className="text-green-700 dark:text-green-300">{email}</strong>. Please check your email and click the confirmation link to verify your account.</p>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : success ? 'Check your email' : 'Sign up'}
            </button>
          </div>
          {success && (
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Already confirmed? Sign in here
              </Link>
            </div>
          )}
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}

