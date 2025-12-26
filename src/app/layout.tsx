
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/navbar';
import { FirebaseClientProvider } from '@/firebase';
import { Icons } from '@/components/icons';
import { Inter, Orbitron } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

/**
 * Metadata for the application, including the title and description.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'MindScape',
  description: 'Generate beautiful, multi-layered mind maps for any topic.',
};

function BackgroundGlow() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_15%)]" />
    </>
  );
}

/**
 * The root layout component for the entire application.
 * It sets up the HTML structure, includes global styles, fonts, and wraps the application
 * with necessary context providers like Firebase.
 * @param {Readonly<{ children: React.ReactNode }>} props - The props for the component.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {JSX.Element} The root layout of the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('dark', inter.variable, orbitron.variable)} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/MindScape-Logo.png" sizes="any" />
      </head>
      <body className={cn('min-h-screen w-full overflow-x-hidden', 'bg-[#0D0D0D] text-[#EAEAEA]')} suppressHydrationWarning>
        <FirebaseClientProvider>
          <BackgroundGlow />
          <Navbar />
          <main className="h-full pt-16">{children}</main>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
