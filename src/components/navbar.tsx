'use client';

import Link from 'next/link';
import { useUser, useFirebase } from '@/firebase';
import { Button } from './ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, LogOut } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { motion } from 'framer-motion';
import { Icons } from './icons';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const [profileName, setProfileName] = useState<string | null>(null);

  // Listen to Firestore for real-time displayName updates
  useEffect(() => {
    if (!user || !firestore) return;

    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileName(data.displayName || null);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Navbar profile snapshot error:", error);
      }
    });

    return () => unsubscribe();
  }, [user, firestore]);

  // Use Firestore name first, then Auth name, then fallback
  const displayName = profileName || user?.displayName || 'User';

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'My Maps' },
    { href: '/public-maps', label: 'Public Maps' },
    { href: '/mind-gpt', label: 'MindGPT' },
  ];

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/');
  };

  const renderUserAuth = () => {
    if (isUserLoading) {
      return <Skeleton className="h-10 w-10 rounded-full bg-secondary" />;
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarImage
                  src={user.photoURL ?? ''}
                  alt={displayName}
                />
                <AvatarFallback className="bg-secondary">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 glassmorphism" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button asChild className="rounded-xl bg-zinc-800/80 px-4 py-2 text-sm text-zinc-200 ring-1 ring-white/10 transition hover:bg-zinc-800 hover:text-white">
        <Link href="/login">Login</Link>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="flex h-16 w-full items-center justify-between bg-black/30 px-4 py-4 backdrop-blur-3xl sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex flex-1 items-center justify-start gap-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5">
            <Icons.logo className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight text-shadow-glow">MindScape</span>
          </Link>
        </div>

        {/* Center Section */}
        <div className="hidden flex-shrink-0 md:flex">
          <nav className="flex items-center rounded-full bg-zinc-900/60 p-1 ring-1 ring-white/10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative rounded-full px-4 py-1.5 text-sm font-medium text-zinc-300 outline-sky-400 transition focus-visible:outline-2"
              >
                {pathname === item.href && (
                  <motion.span
                    layoutId="navbar-pill"
                    className="absolute inset-0 z-0 rounded-full bg-purple-600/30 backdrop-blur-sm border border-purple-500/50"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex flex-1 items-center justify-end">
          {renderUserAuth()}
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
    </header>
  );
}
