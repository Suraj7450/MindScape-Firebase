'use client';

import { AuthForm } from '@/components/auth-form';
import { Brain, Sparkles, Lock, Cloud, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * Premium "Mind Entry Portal" Login Page
 * Features two-column layout with animated visualization and enhanced form
 */
export default function LoginPage() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-fuchsia-950/20" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent" />

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Left Column - Mind Map Visualization & Info */}
          <div className="relative hidden lg:flex flex-col justify-center space-y-8">
            {/* Animated Mind Map Nodes */}
            <div className="relative h-96 mb-8">
              {/* Central Node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center animate-pulse shadow-2xl shadow-violet-500/50">
                <Brain className="w-16 h-16 text-white" />
              </div>

              {/* Orbiting Nodes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 animate-spin-slow">
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm border border-white/10"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-160px) rotate(-${angle}deg)`,
                      transitionDelay: `${i * 100}ms`
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-20 animate-ping" />
                  </div>
                ))}
              </div>

              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="url(#gradient1)" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="url(#gradient1)" strokeWidth="1" />
                <line x1="50%" y1="50%" x2="70%" y2="80%" stroke="url(#gradient1)" strokeWidth="1" />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Hero Text */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 leading-tight">
                Visualize Knowledge.<br />
                Expand Ideas.<br />
                Learn Faster.
              </h1>

              <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                Transform complex topics into interactive mind maps powered by AI. Your personal knowledge visualization platform.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3 pt-4">
                {[
                  { icon: Sparkles, text: 'AI-Powered Maps' },
                  { icon: Zap, text: 'Nested Learning' },
                  { icon: Cloud, text: 'Auto-Sync' }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                    <feature.icon className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-zinc-300">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Enhanced Login Form */}
          <div className="relative w-full max-w-md mx-auto lg:mx-0">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl blur-3xl" />

            {/* Form Container */}
            <div className="relative">
              <AuthForm />

              {/* AI Capability Badge */}
              <div className="mt-6 p-4 rounded-xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">AI-Powered Platform</div>
                      <div className="text-xs text-zinc-500">Gemini 2.5 Flash • Pollinations</div>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* "Why Sign In?" Collapsible */}
              <div className="mt-4">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 hover:bg-zinc-900/50 transition-all group"
                >
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                    Why sign in?
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showInfo ? 'rotate-180' : ''}`} />
                </button>

                {showInfo && (
                  <div className="mt-2 p-4 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {[
                      { icon: Lock, text: 'Your maps are private & encrypted' },
                      { icon: Cloud, text: 'Auto-sync across all devices' },
                      { icon: Brain, text: 'AI remembers your learning path' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-violet-400" />
                        </div>
                        <span className="text-sm text-zinc-400">{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Hero Text */}
              <div className="lg:hidden mt-8 text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">
                  Visualize Knowledge
                </h2>
                <p className="text-sm text-zinc-400">
                  Transform complex topics into interactive mind maps powered by AI
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
