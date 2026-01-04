'use client';

import { AuthForm } from '@/components/auth-form';
import { MessageCircle } from 'lucide-react';

export default function LoginVariantD() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 -mt-16">
            <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
                        <MessageCircle className="w-4 h-4" />
                        <span>Guided Brainstorming</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
                            Let AI ask the
                            <br />
                            <span className="text-purple-400">right questions</span>.
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                            Don't just take notes. Build mind maps through conversation, curiosity, and intelligent guidance.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <div className="px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-sm">
                            "Help me understand Quantum Physics"
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-sm hidden sm:block">
                            "Map out the history of Rome"
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <AuthForm />
                </div>
            </div>
        </div>
    );
}
