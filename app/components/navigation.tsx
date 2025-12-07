'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers/auth-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  // Don't show navigation on auth pages or landing page
  if (pathname?.startsWith('/auth') || pathname === '/') {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-foreground hover:opacity-80 transition-opacity"
          >
            Study Buddy
          </Link>
          <div className="flex space-x-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/dashboard'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/documents"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/documents' || pathname?.startsWith('/documents/')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Documents
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block px-3 py-1.5 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-sm"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}

