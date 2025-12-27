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
    <header className="sticky top-0 z-[100] w-full px-4 py-3 pointer-events-none">
      <div className="mx-auto max-w-7xl w-full pointer-events-auto">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            {/* Left Section: Logo & Brand */}
            <div className="flex flex-1 items-center justify-start">
              <Link href="/" className="group flex items-center gap-3 transition-opacity">
                {/* Refined Glass Icon with Soft Glow */}
                <div className="relative">
                  {/* External Aura Glow - Softened */}
                  <div className="absolute inset-0 rounded-full bg-primary/0 blur-[20px] transition-all duration-500 group-hover:bg-primary/15" />

                  <div className="relative h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-primary/50 overflow-hidden">
                    {/* Inner Content Tint */}
                    <div className="absolute inset-0 bg-primary/0 transition-all duration-500 group-hover:bg-primary/5" />

                    {/* Icon */}
                    <div className="relative z-10 p-1.5">
                      <Icons.logo className="h-6 w-6 transition-all duration-500 group-hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    </div>
                  </div>
                </div>

                {/* Brand Name */}
                <span className="text-xl font-black text-white tracking-tighter">
                  Mind<span className="text-primary group-hover:text-accent transition-colors duration-500">Scape</span>
                </span>
              </Link>
            </div>

            {/* Center Section: Navigation */}
            <nav className="hidden md:flex items-center gap-1 rounded-xl bg-zinc-900/40 p-1 ring-1 ring-white/5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative rounded-lg px-4 py-1.5 text-sm font-semibold text-zinc-400 transition-all hover:text-zinc-100"
                >
                  {pathname === item.href && (
                    <motion.span
                      layoutId="navbar-highlight"
                      className="absolute inset-0 z-0 rounded-lg bg-white/5 backdrop-blur-md border border-white/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right Section: Auth & Profile */}
            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />
              {renderUserAuth()}
            </div>
          </div>

          {/* Subtle Bottom Glow Strip */}
          <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-50" />
        </div>
      </div>
    </header>
  );
}
