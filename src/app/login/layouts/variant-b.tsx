'use client';

import { AuthForm } from '@/components/auth-form';

export default function LoginVariantB() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center -mt-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#7c3aed33,transparent_60%)] animate-pulse" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 max-w-6xl w-full px-6 items-center">
                <div className="space-y-6">
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
                        Your ideas,
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 animate-gradient">
                            amplified.
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-md">
                        AI that understands structure, depth, and meaning. Transform your thoughts into living knowledge maps.
                    </p>
                </div>
                <div className="w-full max-w-md mx-auto">
                    <AuthForm />
                </div>
            </div>
        </div>
    );
}
