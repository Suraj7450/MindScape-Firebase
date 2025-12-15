'use client';

import { AuthForm } from '@/components/auth-form';
import { FileText, ArrowRight } from 'lucide-react';

export default function LoginVariantE() {
    return (
        <div className="min-h-screen bg-background grid lg:grid-cols-2 items-center px-6 -mt-16">
            <div className="max-w-xl mx-auto lg:mx-0 space-y-8">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl shadow-purple-500/10">
                    <FileText className="w-8 h-8 text-purple-400" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                        Turn documents
                        <br />
                        into <span className="text-purple-400">knowledge</span>.
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Upload PDFs, images, or notes and instantly visualize them as interactive, navigable mind maps.
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                    <span className="px-3 py-1 rounded bg-zinc-900 border border-white/10">PDF</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="px-3 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">Mind Map</span>
                </div>
            </div>

            <div className="w-full max-w-md mx-auto">
                <AuthForm />
            </div>
        </div>
    );
}
