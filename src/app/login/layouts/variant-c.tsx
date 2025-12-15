'use client';

import { AuthForm } from '@/components/auth-form';
import { Sparkles, Network, Image as ImageIcon, Zap } from 'lucide-react';

const FEATURES = [
    { icon: Sparkles, text: 'AI-Powered Generation', desc: 'Instant hierarchical structures' },
    { icon: Network, text: 'Infinite Nested Exploration', desc: 'Drill down into any concept' },
    { icon: ImageIcon, text: 'Visual Learning', desc: 'AI-generated concept imagery' },
    { icon: Zap, text: 'Real-time Vision Mode', desc: 'Scan docs into maps instantly' },
];

export default function LoginVariantC() {
    return (
        <div className="min-h-screen bg-background grid lg:grid-cols-2 items-center px-6 -mt-16">
            <div className="space-y-12 max-w-lg mx-auto lg:mx-0">
                <div className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                        Everything starts with a <span className="text-purple-400">thought</span>.
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        MindScape gives your ideas the structure they deserve.
                    </p>
                </div>

                <ul className="space-y-6">
                    {FEATURES.map((f, i) => (
                        <li key={i} className="flex items-start gap-4 group">
                            <div className="mt-1 p-2 rounded-lg bg-zinc-900/50 border border-white/5 group-hover:border-purple-500/30 transition-colors">
                                <f.icon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <span className="block font-semibold text-foreground">{f.text}</span>
                                <span className="text-sm text-muted-foreground">{f.desc}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="w-full max-w-md mx-auto">
                <AuthForm />
            </div>
        </div>
    );
}
