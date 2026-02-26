
'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * A specialized loading skeleton for the Canvas page.
 * Mimics a radial mind map being built.
 */
export default function CanvasLoading() {
    // Generate random branches for the radial skeleton
    const branches = [
        { angle: 0, delay: 0.1 },
        { angle: 45, delay: 0.3 },
        { angle: 90, delay: 0.2 },
        { angle: 135, delay: 0.4 },
        { angle: 180, delay: 0.15 },
        { angle: 225, delay: 0.35 },
        { angle: 270, delay: 0.25 },
        { angle: 315, delay: 0.45 },
    ];

    return (
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#0D0D0D]">
            {/* Background radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)]" />

            <div className="relative z-10">
                {/* Central Hub */}
                <div className="relative h-32 w-32 flex items-center justify-center">
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            boxShadow: [
                                '0 0 20px rgba(139,92,246,0.2)',
                                '0 0 40px rgba(139,92,246,0.4)',
                                '0 0 20px rgba(139,92,246,0.2)'
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-24 w-24 rounded-full bg-zinc-900 border-4 border-primary/30 flex items-center justify-center"
                    >
                        <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse" />
                    </motion.div>
                </div>

                {/* Radial Branches */}
                {branches.map((branch, i) => (
                    <div
                        key={i}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ transform: `translate(-50%, -50%) rotate(${branch.angle}deg)` }}
                    >
                        <div className="flex items-center" style={{ width: '220px' }}>
                            {/* Connecting Line */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: 100 }}
                                transition={{ duration: 1, delay: branch.delay }}
                                className="h-[2px] bg-gradient-to-r from-primary/40 to-transparent"
                            />

                            {/* Outer Node */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: branch.delay + 0.8 }}
                                className="ml-[-10px]"
                            >
                                <Skeleton className="h-10 w-32 rounded-xl bg-zinc-900 border border-white/5 shadow-xl p-2">
                                    <div className="h-full w-full bg-white/5 rounded-md animate-pulse" />
                                </Skeleton>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating particles or background noise */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-primary/20"
                    initial={{
                        x: Math.random() * 100 - 50 + 'vw',
                        y: Math.random() * 100 - 50 + 'vh',
                        opacity: 0
                    }}
                    animate={{
                        y: '-100vh',
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 5,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                />
            ))}

            {/* Loading Status Text */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 font-orbitron mb-2">
                    Architecting Visuals
                </div>
                <div className="h-1 w-48 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ x: [-200, 200] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="h-full w-24 bg-gradient-to-r from-transparent via-primary to-transparent"
                    />
                </div>
            </div>
        </div>
    );
}
