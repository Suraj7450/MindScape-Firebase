'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideSectionProps {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    className?: string;
    index?: number;
}

export function GuideSection({
    title,
    icon: Icon,
    children,
    className,
    index = 0,
}: GuideSectionProps) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-3xl shadow-2xl transition-all hover:border-primary/30",
                className
            )}
        >
            {/* Decorative Glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/5 blur-[100px] transition-all group-hover:bg-primary/10" />

            <div className="relative z-10">
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 text-primary shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white font-orbitron">
                        {title}
                    </h2>
                </div>

                <div className="space-y-4 text-zinc-400 leading-relaxed font-sans">
                    {children}
                </div>
            </div>

            {/* Subtle Bottom Accent */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary to-accent transition-all duration-700 group-hover:w-full" />
        </motion.section>
    );
}

export function GuideStep({ number, title, description }: { number: number; title: string, description: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-sm">
                {number}
            </div>
            <div>
                <h4 className="font-bold text-white mb-1">{title}</h4>
                <p className="text-sm text-zinc-500">{description}</p>
            </div>
        </div>
    );
}
