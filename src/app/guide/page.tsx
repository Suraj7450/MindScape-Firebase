'use client';

import { motion } from 'framer-motion';
import {
    Rocket,
    Map as MapIcon,
    Sparkles,
    Settings,
    BookOpen,
    Zap,
    Brain,
    Layers,
    Image as ImageIcon,
    Key,
    Users,
    Compass
} from 'lucide-react';
import { GuideSection, GuideStep } from '@/components/guide/guide-section';
import { Badge } from '@/components/ui/badge';

export default function GuidePage() {
    return (
        <main className="relative min-h-screen w-full bg-[#030303] text-zinc-100 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
                {/* Header */}
                <header className="mb-20 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6"
                    >
                        <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/5 text-primary-foreground tracking-widest font-orbitron uppercase text-[10px]">
                            <BookOpen className="w-3.5 h-3.5 mr-2" />
                            Mastering MindScape
                        </Badge>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-6 font-orbitron"
                    >
                        USER <span className="text-primary">GUIDE</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-zinc-400 max-w-2xl leading-relaxed"
                    >
                        Everything you need to know about building, exploring, and sharing intelligent mind maps with MindScape AI.
                    </motion.p>
                </header>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-12">

                    {/* Section 1: Quick Start */}
                    <GuideSection title="Quick Start Guide" icon={Rocket} index={0}>
                        <p>Welcome to MindScape! Generating your first idea is simple and intuitive.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <GuideStep
                                number={1}
                                title="Input Your Topic"
                                description="Type any concept, question, or thought into the main input bar on the home page."
                            />
                            <GuideStep
                                number={2}
                                title="Select Your Depth"
                                description="Choose between Standard (fast overview) or Deep (comprehensive analysis) modes."
                            />
                            <GuideStep
                                number={3}
                                title="Choose a Persona"
                                description="Pick a teacher, creative visionary, or efficiency expert to style the AI's response."
                            />
                            <GuideStep
                                number={4}
                                title="Launch Thought"
                                description="Hit enter and watch the AI build a multi-layered visual map in real-time."
                            />
                        </div>
                    </GuideSection>

                    {/* Section 2: Canvas Features */}
                    <GuideSection title="The Interactive Canvas" icon={MapIcon} index={1}>
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-primary" />
                                        Node Interaction
                                    </h3>
                                    <p>Our canvas isn't just a static image—it's a living workspace. You can:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li><span className="text-white font-medium">Expand Nodes:</span> Click the "+" icon on sub-categories to generate even deeper layers.</li>
                                        <li><span className="text-white font-medium">Auto-Layout:</span> Use the wand icon in the toolbar to automatically reorganize your map nodes.</li>
                                        <li><span className="text-white font-medium">Full Screen:</span> Toggle focus mode for distraction-free brainstorming.</li>
                                    </ul>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-primary" />
                                        Advanced AI Chat
                                    </h3>
                                    <p>Open the right-side panel to chat directly with your mind map. The AI knows exactly what's on your canvas and can help you add nodes, summarize sections, or suggest related topics.</p>
                                </div>
                            </div>
                        </div>
                    </GuideSection>

                    {/* Section 3: AI Modes & Grounding */}
                    <GuideSection title="AI Intelligence Modes" icon={Zap} index={2}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Standard</Badge>
                                    Standard Mode
                                </h3>
                                <p className="text-sm">Perfect for quick summaries and general overviews. It generates ~30 nodes covering the essential aspects of your topic. Fast and creative.</p>
                            </div>
                            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Badge className="bg-primary/20 text-primary border-primary/30">Deep</Badge>
                                    Deep Mode
                                </h3>
                                <p className="text-sm">Used for intense research. This mode uses high-reasoning models (like DeepSeek or Qwen) to generate ~200 items with detailed insights and thought processes for every branch.</p>
                            </div>
                        </div>
                        <div className="mt-8 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-3 mb-4">
                                <Compass className="w-6 h-6 text-amber-500" />
                                <h3 className="text-lg font-bold text-white">Real-Time Search Grounding</h3>
                            </div>
                            <p className="text-sm">Every mind map generation includes real-time Google search grounding. The AI searches the live web, reads current sources, and builds your map based on the latest facts, not just training data from years ago.</p>
                        </div>
                    </GuideSection>

                    {/* Section 4: Visual Insight Lab */}
                    <GuideSection title="Visual Insight Lab" icon={ImageIcon} index={3}>
                        <p className="mb-4">Bring your thoughts to life with cinematic AI image generation. Each leaf node can be visualized using our custom lab.</p>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-accent" />
                                    <span className="font-bold text-white">Style Customization</span>
                                </div>
                                <p className="text-sm">Choose from Cinematic, Minimalist, Cyberpunk, or Professional styles. Select aspect ratios and composition presets (like Wide Shot or Close-up).</p>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-accent" />
                                    <span className="font-bold text-white">Prompt Enhancement</span>
                                </div>
                                <p className="text-sm">Our "AI Enhancer" takes your simple ideas and expands them into a complex cinematic prompt, including lighting, mood (like Golden Hour), and technical rendering details.</p>
                            </div>
                        </div>
                    </GuideSection>

                    {/* Section 5: API Keys & Settings */}
                    <GuideSection title="Personal API Key Setup" icon={Key} index={4}>
                        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/5">
                            <p className="mb-4">To unlock premium models and higher generation limits, we recommend adding your own <span className="text-white font-bold">Pollinations.ai</span> API key.</p>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">1</div>
                                    <p className="text-sm">Visit <a href="https://pollinations.ai" target="_blank" className="text-primary hover:underline">Pollinations.ai</a> and create an account.</p>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">2</div>
                                    <p className="text-sm">Grab your API key from your profile dashboard.</p>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">3</div>
                                    <p className="text-sm">Go to your <span className="text-white font-medium">MindScape Profile</span> and paste the key into the Pollinations API field.</p>
                                </div>
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-xs text-primary/80 italic">Note: If you don't have a key, MindScape will use our server fallback, but limits may apply during peak times.</p>
                            </div>
                        </div>
                    </GuideSection>

                    {/* Section 6: Community & Sharing */}
                    <GuideSection title="Library & Community" icon={Users} index={5}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-white font-bold uppercase tracking-wider text-xs">Your Library</h4>
                                <p className="text-sm">Every map you generate is automatically saved to your library. You can revisit, rename, delete, or re-render them at any time.</p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-white font-bold uppercase tracking-wider text-xs">Public Showroom</h4>
                                <p className="text-sm">Published a masterpiece? Toggle the "Public" switch to share it in the Community tab for the world to see and explore.</p>
                            </div>
                        </div>
                    </GuideSection>

                </div>

                {/* Footer Call to Action */}
                <footer className="mt-32 text-center">
                    <h2 className="text-3xl font-bold text-white font-orbitron mb-8">Ready to start thinking?</h2>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => window.location.href = '/'} className="px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20">
                            Return to Home
                        </button>
                        <button onClick={() => window.location.href = '/profile'} className="px-8 py-4 rounded-2xl bg-zinc-900 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                            Setup Profile
                        </button>
                    </div>
                </footer>
            </div>
        </main>
    );
}
