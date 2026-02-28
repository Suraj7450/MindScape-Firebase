
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '../icons';

const generationSteps = [
    'Initializing Nerve Center...',
    'Mapping Synaptic Architecture...',
    'Synthesizing Knowledge Nodes...',
    'Processing Cognitive Depth...',
    'Stabilizing Intelligence Matrix...',
];

const stepDurations = [2000, 3000, 4000, 5000, 2000];

export function LogoLoading() {
    const [currentStep, setCurrentStep] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (currentStep < generationSteps.length - 1) {
            const timer = setTimeout(() => {
                setCurrentStep(currentStep + 1);
            }, stepDurations[currentStep]);

            return () => clearTimeout(timer);
        }
    }, [currentStep]);

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60);
        const remainingSeconds = secs % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090b]">
            {/* Background Neural Pulse */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[80px] animate-pulse" />
            </div>

            <div className="relative flex flex-col items-center gap-12 max-w-md w-full px-6">

                {/* Orbital Logo Container */}
                <div className="relative w-48 h-48 flex items-center justify-center">

                    {/* Outer Orbital Ring */}
                    <div className="absolute inset-0 rounded-full border border-white/5 nm-flat animate-[spin_10s_linear_infinite]" />

                    {/* Inner Orbital Ring */}
                    <div className="absolute inset-4 rounded-full border border-white/10 nm-pressed animate-[spin_6s_linear_infinite_reverse]" />

                    {/* Logo Housing */}
                    <div className="relative w-24 h-24 rounded-3xl nm-flat flex items-center justify-center p-5 z-10 overflow-hidden group animate-logo-pulse">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Icons.logo className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                    </div>

                    {/* Neural Orbit Points - Container Rotation for stability */}
                    <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
                    </div>
                    <div className="absolute inset-0 animate-[spin_8s_linear_infinite_reverse]">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" />
                    </div>
                </div>

                {/* Textual Context */}
                <div className="text-center space-y-6 w-full">
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-white tracking-widest font-orbitron uppercase">
                            MindScape <span className="text-purple-500">Neural</span> Engine
                        </h2>
                        <div className="flex items-center justify-center gap-3 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                            <span>Synthesizing Hub: {formatTime(seconds)}</span>
                        </div>
                    </div>

                    {/* Stepper Progress */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-orbitron">
                                Current Phase
                            </span>
                            <span className="text-[10px] font-bold text-purple-400 font-mono">
                                {Math.round(((currentStep + 1) / generationSteps.length) * 100)}%
                            </span>
                        </div>

                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden nm-pressed p-[1px]">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                style={{ width: `${((currentStep + 1) / generationSteps.length) * 100}%` }}
                            />
                        </div>

                        <p className="text-sm font-medium text-zinc-300 animate-pulse font-orbitron tracking-tight">
                            {generationSteps[currentStep]}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
