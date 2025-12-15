'use client';

import { AuthForm } from '@/components/auth-form';
import { Brain } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Login Page - Inspired by reference design
 * Clean, minimal, with particle constellation effect
 */
export default function LoginPage() {
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate random particles for constellation effect
    const newParticles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f23] relative overflow-hidden">
      {/* Particle Constellation Background */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-violet-400/40 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s',
            }}
          />
        ))}

        {/* Connection Lines SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {particles.slice(0, 20).map((p1, i) => {
            const p2 = particles[(i + 1) % 20];
            return (
              <line
                key={i}
                x1={`${p1.x}%`}
                y1={`${p1.y}%`}
                x2={`${p2.x}%`}
                y2={`${p2.y}%`}
                stroke="url(#lineGradient)"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen grid lg:grid-cols-2 items-center px-6 lg:px-16 gap-16">

        {/* Left Side - Branding & Features */}
        <div className="space-y-12 lg:space-y-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                <Brain className="w-7 h-7 text-white" />
              </div>
              {/* Orbiting Dots */}
              <div className="absolute -inset-2">
                {[0, 120, 240].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-2 h-2"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-24px)`,
                      animation: 'orbit 3s linear infinite',
                      animationDelay: `${i * 1}s`,
                    }}
                  >
                    <div className="w-2 h-2 bg-violet-400 rounded-full shadow-lg shadow-violet-400/50" />
                  </div>
                ))}
              </div>
            </div>
            <span className="text-2xl font-bold text-white">MindScape</span>
          </div>

          {/* Hero Text */}
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Visualize your<br />thoughts
            </h1>
            <p className="text-lg text-indigo-300/80 max-w-md">
              Transform complex ideas into interactive mind maps powered by AI.
              Your personal knowledge visualization platform.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="flex items-center gap-4 text-sm text-indigo-300">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
              <span>Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <AuthForm />
        </div>
      </div>

      {/* Orbit Animation */}
      <style jsx>{`
        @keyframes orbit {
          from {
            transform: translate(-50%, -50%) rotate(0deg) translateY(-24px);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg) translateY(-24px);
          }
        }
      `}</style>
    </div>
  );
}
