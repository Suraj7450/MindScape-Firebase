'use client';

import { AuthForm } from '@/components/auth-form';
import { Brain, Sparkles, Network, Zap, MessageCircle, Image as ImageIcon, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LoginVariantA() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            icon: Sparkles,
            title: "Instant Mind Maps",
            description: "Instantly structure any topic into a clear, hierarchical format with AI-powered generation."
        },
        {
            icon: Network,
            title: "Nested Expansions",
            description: "Explore complex relationships and expand knowledge infinitely through nested inline expansions."
        },
        {
            icon: MessageCircle,
            title: "Guided Brainstorming",
            description: "Engage in a guided, conversational process to build knowledge with AI assistance."
        },
        {
            icon: ImageIcon,
            title: " AI Image Generation",
            description: "Generate visual aids with AI-powered image generation to enhance understanding."
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const CurrentIcon = slides[currentSlide].icon;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <div className="relative min-h-screen flex items-center justify-center px-4 py-4 -mt-16">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

                    {/* Left Side */}
                    <div className="h-full w-full">
                        <div className="relative h-full rounded-2xl border border-white/5 bg-zinc-900/40 p-8 shadow-[0_0_35px_rgba(168,85,247,0.2)] backdrop-blur-sm flex flex-col justify-between min-h-[520px]">
                            {/* Brand */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                            <Brain className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-xl animate-pulse-glow" />
                                    </div>
                                    <span className="text-2xl font-bold text-foreground">MindScape</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    An intelligent, AI-powered platform that transforms topics, concepts, and documents into structured, multi-layered mind maps.
                                </p>
                            </div>

                            {/* Carousel */}
                            <div className="py-8">
                                <div className="space-y-6">
                                    <div className="inline-flex">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                                <CurrentIcon className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="absolute inset-0 rounded-2xl bg-purple-500/20 blur-xl animate-pulse-glow" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-bold text-foreground">{slides[currentSlide].title}</h3>
                                        <p className="text-base text-muted-foreground leading-relaxed min-h-[48px]">
                                            {slides[currentSlide].description}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {slides.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentSlide(index)}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-purple-400' : 'w-1.5 bg-zinc-700 hover:bg-zinc-600'}`}
                                                aria-label={`Go to slide ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tagline */}
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Visualize Smarter. <span className="text-purple-400">Think Faster.</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="w-full max-w-md mx-auto h-full">
                        <AuthForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
