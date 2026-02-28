'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, setDoc, collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { updateProfile, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Loader2, Flame, Map, Brain, LogOut, Settings, Globe, Wand2,
    Pencil, Check, X, Trophy, Target, Lock, ChevronRight, Sparkles, Copy, Key, HelpCircle, RefreshCw, ShieldCheck, Activity
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { languages } from '@/lib/languages';
import { format } from 'date-fns';
import { syncHistoricalStatistics } from '@/lib/activity-tracker';
import { ModelSelector } from '@/components/model-selector';
import { Eye, EyeOff, Menu } from 'lucide-react';
import { getUserImageSettings, saveUserApiKey } from '@/lib/firestore-helpers';
import { checkPollenBalanceAction } from '@/app/actions';

// Types
// Types
interface UserProfile {
    uid?: string;
    displayName: string;
    email: string;
    photoURL?: string;
    activeBadgeId?: string;
    preferences: {
        preferredLanguage: string;
        defaultAIPersona: string;
        defaultExplanationMode?: string;
        autoGenerateImages?: boolean;
        deepExpansionMode?: boolean;
        defaultMapView?: string;
        autoSaveFrequency?: number;
    };
    statistics: {
        totalMapsCreated: number;
        totalNestedExpansions: number;
        totalImagesGenerated: number;
        totalStudyTimeMinutes: number;
        currentStreak: number;
        longestStreak: number;
        lastActiveDate: string;
        totalNodes?: number;
    };
    goals?: {
        weeklyMapGoal: number;
        monthlyMapGoal: number;
    };
    apiSettings?: {
        provider?: 'pollinations';
        imageProvider?: 'pollinations';
        pollinationsModel?: string;
        pollinationsApiKey?: string;
    };
}

interface Tier {
    level: 1 | 2 | 3;
    requirement: number;
    label: string;
    description: string;
    color: string;
    shadow: string;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    category: 'maps' | 'streak' | 'nodes' | 'depth' | 'images';
    tiers: Tier[];
}

const ACHIEVEMENT_TIERS: Achievement[] = [
    {
        id: 'map_master',
        name: 'Map Architect',
        description: 'Awards for creating and organizing new mind maps',
        icon: Map,
        category: 'maps',
        tiers: [
            { level: 1, requirement: 1, label: 'Early Draft', description: 'Create your first mind map', color: 'text-blue-400', shadow: 'shadow-blue-500/20' },
            { level: 2, requirement: 10, label: 'Cartographer', description: 'Create 10 functional mind maps', color: 'text-indigo-400', shadow: 'shadow-indigo-500/20' },
            { level: 3, requirement: 50, label: 'Grand Architect', description: 'Create 50 complex mind maps', color: 'text-sky-400', shadow: 'shadow-sky-500/20' },
        ]
    },
    {
        id: 'streak_warrior',
        name: 'Consistency King',
        description: 'Rewards for daily login consistency',
        icon: Flame,
        category: 'streak',
        tiers: [
            { level: 1, requirement: 1, label: 'Initiated', description: '1-day login streak', color: 'text-orange-400', shadow: 'shadow-orange-500/20' },
            { level: 2, requirement: 7, label: 'Dedicated', description: '7-day login streak', color: 'text-red-400', shadow: 'shadow-red-500/20' },
            { level: 3, requirement: 30, label: 'Unstoppable', description: '30-day login streak', color: 'text-amber-400', shadow: 'shadow-amber-500/20' },
        ]
    },
    {
        id: 'topic_explorer',
        name: 'Knowledge Seeker',
        description: 'Based on total nodes generated across all maps',
        icon: Brain,
        category: 'nodes',
        tiers: [
            { level: 1, requirement: 10, label: 'Curious', description: 'Generate 10 information nodes', color: 'text-violet-400', shadow: 'shadow-violet-500/20' },
            { level: 2, requirement: 100, label: 'Scholar', description: 'Generate 100 information nodes', color: 'text-fuchsia-400', shadow: 'shadow-fuchsia-500/20' },
            { level: 3, requirement: 500, label: 'Sage', description: 'Generate 500 information nodes', color: 'text-purple-400', shadow: 'shadow-purple-500/20' },
        ]
    },
    {
        id: 'deep_diver',
        name: 'AI Deep-Dive',
        description: 'Based on total nested node expansions',
        icon: Target,
        category: 'depth',
        tiers: [
            { level: 1, requirement: 5, label: 'Explorer', description: 'Expand 5 nested nodes', color: 'text-emerald-400', shadow: 'shadow-emerald-500/20' },
            { level: 2, requirement: 25, label: 'Diver', description: 'Expand 25 nested nodes', color: 'text-teal-400', shadow: 'shadow-teal-500/20' },
            { level: 3, requirement: 100, label: 'Master Diver', description: 'Expand 100 nested nodes', color: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
        ]
    },
    {
        id: 'visual_learner',
        name: 'Visual Learner',
        description: 'Based on total AI images generated',
        icon: Wand2,
        category: 'images',
        tiers: [
            { level: 1, requirement: 1, label: 'Artist', description: 'Generate your first AI image', color: 'text-pink-400', shadow: 'shadow-pink-500/20' },
            { level: 2, requirement: 20, label: 'Creator', description: 'Generate 20 AI images', color: 'text-rose-400', shadow: 'shadow-rose-500/20' },
            { level: 3, requirement: 100, label: 'Visionary', description: 'Generate 100 AI images', color: 'text-red-400', shadow: 'shadow-red-500/20' },
        ]
    }
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, firestore, auth } = useFirebase();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activeMapsCount, setActiveMapsCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'lab' | 'preferences' | 'security'>('overview');
    const [isSyncing, setIsSyncing] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [preferredModel, setPreferredModel] = useState('flux');
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [pollenBalance, setPollenBalance] = useState<number | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [lastBalanceCheck, setLastBalanceCheck] = useState<Date | null>(null);



    // Load profile data
    useEffect(() => {
        if (!user || !firestore) {
            setLoading(false);
            return;
        }

        let unsubscribeProfile: (() => void) | null = null;
        let unsubscribeMaps: (() => void) | null = null;

        const setupListeners = async () => {
            try {
                // Set up real-time listener for profile
                const userRef = doc(firestore, 'users', user.uid);
                unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const profileData: UserProfile = {
                            displayName: data.displayName || user.displayName || 'User',
                            email: data.email || user.email || '',
                            photoURL: data.photoURL || user.photoURL,
                            activeBadgeId: data.activeBadgeId,
                            preferences: {
                                preferredLanguage: data.preferences?.preferredLanguage || 'en',
                                defaultAIPersona: data.preferences?.defaultAIPersona || 'Concise',
                                defaultExplanationMode: data.preferences?.defaultExplanationMode,
                                autoGenerateImages: data.preferences?.autoGenerateImages,
                                deepExpansionMode: data.preferences?.deepExpansionMode || false,
                                defaultMapView: data.preferences?.defaultMapView,
                                autoSaveFrequency: data.preferences?.autoSaveFrequency,
                            },
                            statistics: {
                                totalMapsCreated: data.statistics?.totalMapsCreated || 0,
                                totalNestedExpansions: data.statistics?.totalNestedExpansions || 0,
                                totalImagesGenerated: data.statistics?.totalImagesGenerated || 0,
                                totalStudyTimeMinutes: data.statistics?.totalStudyTimeMinutes || 0,
                                currentStreak: data.statistics?.currentStreak || 0,
                                longestStreak: data.statistics?.longestStreak || 0,
                                lastActiveDate: data.statistics?.lastActiveDate || '',
                                totalNodes: data.statistics?.totalNodes || 0,
                            },
                            apiSettings: {
                                provider: data.apiSettings?.provider || 'pollinations',
                                imageProvider: data.apiSettings?.imageProvider || 'pollinations',
                                pollinationsModel: data.apiSettings?.pollinationsModel || '',
                                pollinationsApiKey: data.apiSettings?.pollinationsApiKey || '',
                            },
                            goals: data.goals
                        };
                        setProfile(profileData);
                        setEditName(profileData.displayName);
                        setApiKeyInput(profileData.apiSettings?.pollinationsApiKey || '');

                        // Sync active maps count in real-time indirectly? 
                        // Actually, it's better to just fetch it here or use a separate listener.
                        // For now, let's keep the one-time fetch but make it more robust.
                    } else {
                        const defaultData: UserProfile = {
                            displayName: user.displayName || 'User',
                            email: user.email || '',
                            photoURL: user.photoURL || undefined,
                            preferences: {
                                preferredLanguage: 'en',
                                defaultAIPersona: 'Concise',
                                autoGenerateImages: false,
                                deepExpansionMode: false,
                            },
                            apiSettings: {
                                provider: 'pollinations',
                                imageProvider: 'pollinations',
                                pollinationsModel: '',
                                pollinationsApiKey: '',
                            },
                            statistics: {
                                totalMapsCreated: 0,
                                totalNestedExpansions: 0,
                                totalImagesGenerated: 0,
                                totalStudyTimeMinutes: 0,
                                currentStreak: 0,
                                longestStreak: 0,
                                lastActiveDate: '',
                                totalNodes: 0,
                            },
                        };
                        setProfile(defaultData);
                        setEditName(defaultData.displayName);
                    }
                    setLoading(false);
                }, (error) => {
                    // Ignore permission errors that happen during logout
                    if (error.code !== 'permission-denied') {
                        console.error("Profile snapshot error:", error);
                    }
                });

                // Get active maps count (real-time listener)
                const mapsQuery = query(collection(firestore, 'users', user.uid, 'mindmaps'));
                unsubscribeMaps = onSnapshot(mapsQuery, (snapshot) => {
                    setActiveMapsCount(snapshot.size);
                });

            } catch (error) {
                console.error('Error loading profile:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load profile' });
                setLoading(false);
            }
        };

        setupListeners();

        // Load additional image settings
        getUserImageSettings(firestore, user.uid).then(settings => {
            if (settings?.preferredModel) {
                setPreferredModel(settings.preferredModel);
            }
        });

        return () => {
            if (unsubscribeProfile) unsubscribeProfile();
            if (unsubscribeMaps) unsubscribeMaps();
        };
    }, [user, firestore, toast]);

    // Derived state for provider mode
    const getActiveMode = (): 'default' | 'pollinations' => {
        if (profile?.apiSettings?.provider === 'pollinations') return 'pollinations';
        return 'default';
    };
    const activeMode = getActiveMode();

    const getActiveImageMode = (): 'pollinations' => {
        return 'pollinations';
    };
    const activeImageMode = getActiveImageMode();

    const setAIConfig = async (mode: 'pollinations') => {
        if (!user || !firestore) return;
        try {
            await setDoc(doc(firestore, 'users', user.uid), {
                apiSettings: { provider: 'pollinations' }
            }, { merge: true });

            toast({
                title: 'Updated',
                description: 'AI Provider set to Pollinations'
            });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings' });
        }
    };

    const saveDisplayName = async () => {
        if (!user || !firestore || !editName.trim()) return;
        setIsSaving(true);
        try {
            await setDoc(doc(firestore, 'users', user.uid), { displayName: editName.trim() }, { merge: true });

            // Sync with Firebase Auth
            await updateProfile(user, { displayName: editName.trim() });

            setIsEditing(false);
            toast({ title: 'Saved', description: 'Your name has been updated.' });
        } catch (error) {
            console.error('Error saving name:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save name' });
        } finally {
            setIsSaving(false);
        }
    };

    const savePreference = async (key: string, value: string) => {
        if (!user || !firestore) return;
        try {
            await setDoc(doc(firestore, 'users', user.uid), { preferences: { [key]: value } }, { merge: true });
            toast({ title: 'Saved', description: 'Preference updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save' });
        }
    };



    const equipBadge = async (badgeId: string) => {
        if (!user || !firestore) return;
        try {
            await setDoc(doc(firestore, 'users', user.uid), { activeBadgeId: badgeId }, { merge: true });
            toast({ title: 'Badge Equipped', description: 'Your profile badge has been updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to equip badge' });
        }
    };

    const fetchPollenBalance = async (keyOverride?: string) => {
        if (!user) return;
        setIsLoadingBalance(true);
        setBalanceError(null);
        try {
            const result = await checkPollenBalanceAction({
                apiKey: keyOverride || apiKeyInput || undefined,
                userId: user.uid,
            });
            if (result.error) {
                setBalanceError(result.error);
                setPollenBalance(null);
            } else {
                setPollenBalance(result.balance);
            }
            setLastBalanceCheck(new Date());
        } catch {
            setBalanceError('Network error. Try again.');
        } finally {
            setIsLoadingBalance(false);
        }
    };

    // Auto-fetch balance when profile loads with an existing key
    useEffect(() => {
        if (profile?.apiSettings?.pollinationsApiKey && user) {
            fetchPollenBalance(profile.apiSettings.pollinationsApiKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.apiSettings?.pollinationsApiKey, user?.uid]);

    const handleSaveApiKey = async () => {
        if (!user || !firestore) return;
        setIsSavingKey(true);
        try {
            await saveUserApiKey(firestore, user.uid, apiKeyInput, preferredModel);
            toast({ title: 'API Key Saved', description: 'Your personal access key has been updated.' });
            // Auto-refresh balance after saving a new key
            if (apiKeyInput) {
                fetchPollenBalance(apiKeyInput);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleSaveModelPreference = async (modelId: string) => {
        if (!user || !firestore) return;
        setIsSavingKey(true);
        try {
            setPreferredModel(modelId);
            await saveUserApiKey(firestore, user.uid, apiKeyInput, modelId);
            toast({ title: 'Preference Saved', description: `Default model set to ${modelId}` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleLogout = async () => {
        try {
            if (auth) {
                await signOut(auth);
                router.push('/');
            }
        } catch (error) {
            console.error("Logout error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to sign out' });
        }
    };

    const handleSyncStatus = async () => {
        if (!user || !firestore) return;
        setIsSyncing(true);
        try {
            await syncHistoricalStatistics(firestore, user.uid);
            toast({
                title: 'Statistics Synced!',
                description: 'Your historical activity data has been aggregated into your profile.',
            });
        } catch (error) {
            console.error('Sync error:', error);
            toast({
                variant: 'destructive',
                title: 'Sync Failed',
                description: 'Could not process historical data sync.',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!user || !profile) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <Card className="bg-zinc-900/90 border-zinc-800 max-w-sm w-full text-center p-8">
                    <LogOut className="h-12 w-12 text-violet-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Not Signed In</h2>
                    <p className="text-zinc-400 text-sm mb-6">Sign in to view your profile</p>
                    <Button onClick={() => router.push('/')} className="bg-violet-600 hover:bg-violet-700">
                        Go Home
                    </Button>
                </Card>
            </div>
        );
    }

    const memberSince = user.metadata?.creationTime
        ? format(new Date(user.metadata.creationTime), 'MMM yyyy')
        : 'New';

    const stats = {
        maps: profile.statistics.totalMapsCreated || activeMapsCount,
        streak: profile.statistics.currentStreak,
        nodes: profile.statistics.totalNodes || 0,
        depth: profile.statistics.totalNestedExpansions || 0,
        images: profile.statistics.totalImagesGenerated || 0,
    };

    // Calculate total unlocked tiers
    const totalUnlockedTiers = ACHIEVEMENT_TIERS.reduce((acc, ach) => {
        const value = stats[ach.category];
        return acc + ach.tiers.filter(t => value >= t.requirement).length;
    }, 0);

    const getActiveBadgeLabel = () => {
        if (!profile.activeBadgeId) return "Early Adopter";
        const [achId, level] = profile.activeBadgeId.split(':');
        const ach = ACHIEVEMENT_TIERS.find(a => a.id === achId);
        const tier = ach?.tiers.find(t => t.level === parseInt(level));
        return tier ? tier.label : "Early Adopter";
    };

    // Helper for duration formatting
    const formatDuration = (minutes: number | undefined | null) => {
        if (!minutes || isNaN(minutes)) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    };

    // Helper for navigation items
    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: Brain, desc: 'Identity & Growth' },
        { id: 'lab', label: 'AI Lab', icon: Sparkles, desc: 'API & Engine Hub' },
        { id: 'preferences', label: 'Preferences', icon: Settings, desc: 'System Behavior' },
        { id: 'security', label: 'Security', icon: Lock, desc: 'Account & Safety' },
    ] as const;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden selection:bg-violet-500/30 font-sans">
            {/* Professional Background Layer */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-violet-600/5 blur-[160px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-600/5 blur-[160px] rounded-full" />
            </div>

            {/* Sidebar Navigation */}
            <aside className="hidden lg:flex w-80 border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl flex-col z-20 relative">
                <div className="p-8 flex flex-col h-full">
                    {/* Brand/Top Identity */}
                    <div className="flex items-center gap-3 mb-12 px-2">
                        <div className="w-10 h-10 nm-flat rounded-xl flex items-center justify-center">
                            <Brain className="h-6 w-6 text-violet-400" />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tighter text-white">MindScape</span>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Intelligence Hub</p>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="space-y-2 flex-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`
                                        w-full flex items-center gap-4 p-4 rounded-2xl transition-all group
                                        ${isActive
                                            ? 'nm-flat text-white'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
                                    `}
                                >
                                    <div className={`
                                        p-2 rounded-xl transition-all
                                        ${isActive ? 'bg-violet-500/10 nm-inset-glow' : 'bg-transparent'}
                                    `}>
                                        <Icon className={`h-5 w-5 ${isActive ? 'text-violet-400' : 'group-hover:text-zinc-300'}`} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold tracking-tight">{item.label}</p>
                                        <p className={`text-[10px] font-medium transition-colors ${isActive ? 'text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                        <div className="nm-pressed p-4 rounded-2xl flex items-center gap-4">
                            <Avatar className="h-10 w-10 rounded-xl nm-flat p-0.5">
                                <AvatarImage src={profile.photoURL} className="rounded-[10px]" />
                                <AvatarFallback className="bg-zinc-900 text-xs font-bold text-violet-400 rounded-[10px]">
                                    {profile.displayName?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{profile.displayName}</p>
                                <p className="text-[10px] text-zinc-500 truncate">{profile.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full justify-start h-12 gap-3 text-zinc-500 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="text-sm font-bold">Sign Out</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto px-6 py-12 lg:px-12">
                    {/* Header Stage */}
                    <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-center justify-between md:block">
                            <div className="md:hidden">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="nm-flat rounded-xl text-zinc-400">
                                            <Menu className="h-6 w-6" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="bg-zinc-950 border-white/5 p-0 w-80">
                                        <div className="p-8 flex flex-col h-full bg-zinc-950/50 backdrop-blur-xl">
                                            {/* Brand/Top Identity */}
                                            <div className="flex items-center gap-3 mb-12 px-2">
                                                <div className="w-10 h-10 nm-flat rounded-xl flex items-center justify-center">
                                                    <Brain className="h-6 w-6 text-violet-400" />
                                                </div>
                                                <div>
                                                    <span className="text-xl font-black tracking-tighter text-white">MindScape</span>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Intelligence Hub</p>
                                                </div>
                                            </div>

                                            {/* Nav Links */}
                                            <nav className="space-y-2 flex-1">
                                                {navItems.map((item) => {
                                                    const Icon = item.icon;
                                                    const isActive = activeTab === item.id;
                                                    return (
                                                        <SheetClose asChild key={item.id}>
                                                            <button
                                                                onClick={() => setActiveTab(item.id)}
                                                                className={`
                                                                    w-full flex items-center gap-4 p-4 rounded-2xl transition-all group
                                                                    ${isActive
                                                                        ? 'nm-flat text-white'
                                                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
                                                                `}
                                                            >
                                                                <div className={`
                                                                    p-2 rounded-xl transition-all
                                                                    ${isActive ? 'bg-violet-500/10 nm-inset-glow' : 'bg-transparent'}
                                                                `}>
                                                                    <Icon className={`h-5 w-5 ${isActive ? 'text-violet-400' : 'group-hover:text-zinc-300'}`} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-sm font-bold tracking-tight">{item.label}</p>
                                                                    <p className={`text-[10px] font-medium transition-colors ${isActive ? 'text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                                                                        {item.desc}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        </SheetClose>
                                                    );
                                                })}
                                            </nav>

                                            {/* Bottom Actions */}
                                            <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                                                <div className="nm-pressed p-4 rounded-2xl flex items-center gap-4">
                                                    <Avatar className="h-10 w-10 rounded-xl nm-flat p-0.5">
                                                        <AvatarImage src={profile.photoURL} className="rounded-[10px]" />
                                                        <AvatarFallback className="bg-zinc-900 text-xs font-bold text-violet-400 rounded-[10px]">
                                                            {profile.displayName?.charAt(0)?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white truncate">{profile.displayName}</p>
                                                        <p className="text-[10px] text-zinc-500 truncate">{profile.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    onClick={handleLogout}
                                                    className="w-full justify-start h-12 gap-3 text-zinc-500 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all"
                                                >
                                                    <LogOut className="h-5 w-5" />
                                                    <span className="text-sm font-bold">Sign Out</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                            <div className="hidden md:block">
                                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-[0.3em] mb-2">
                                    <div className="w-1 h-3 bg-violet-500/50 rounded-full" />
                                    {activeTab === 'overview' ? 'DASHBOARD' : activeTab.toUpperCase()} / {profile.displayName}
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
                                {navItems.find(i => i.id === activeTab)?.label}
                            </h1>
                            <p className="hidden md:block text-zinc-500 font-medium">
                                {navItems.find(i => i.id === activeTab)?.desc}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                className="nm-flat hover:nm-pressed text-zinc-400 hover:text-white transition-all gap-2 h-11 px-6 rounded-2xl border-none text-xs font-bold uppercase tracking-widest bg-transparent"
                                onClick={handleSyncStatus}
                                disabled={isSyncing}
                            >
                                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Sync Hub
                            </Button>
                        </div>
                    </header>

                    {/* Active Section Content */}
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'overview' && (
                            <div className="space-y-12">
                                {/* Statistics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="nm-flat rounded-[2.5rem] p-8 group transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="p-4 bg-blue-500/10 rounded-2xl nm-inset-glow">
                                                <Map className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <Badge className="bg-blue-500/10 text-blue-400 border-none rounded-full px-3 py-1 text-[10px] font-bold">ARCHITECT</Badge>
                                        </div>
                                        <p className="text-4xl font-black text-white mb-1 relative z-10">{stats.maps}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest relative z-10">Maps Visualized</p>
                                    </div>

                                    <div className="nm-flat rounded-[2.5rem] p-8 group transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="p-4 bg-orange-500/10 rounded-2xl nm-inset-glow">
                                                <Flame className="h-6 w-6 text-orange-400" />
                                            </div>
                                            <Badge className="bg-orange-500/10 text-orange-400 border-none rounded-full px-3 py-1 text-[10px] font-bold">STREAK</Badge>
                                        </div>
                                        <p className="text-4xl font-black text-white mb-1 relative z-10">{stats.streak}</p>
                                        <div className="flex items-center gap-2 relative z-10">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Days</p>
                                            <span className="text-[10px] text-zinc-600">•</span>
                                            <span className="text-[10px] text-zinc-500 font-bold">MAX {profile.statistics.longestStreak || 0}</span>
                                        </div>
                                    </div>

                                    <div className="nm-flat rounded-[2.5rem] p-8 group transition-all duration-500 hover:scale-[1.02] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="p-4 bg-violet-500/10 rounded-2xl nm-inset-glow">
                                                <Brain className="h-6 w-6 text-violet-400" />
                                            </div>
                                            <Badge className="bg-violet-500/10 text-violet-400 border-none rounded-full px-3 py-1 text-[10px] font-bold">SCHOLAR</Badge>
                                        </div>
                                        <p className="text-4xl font-black text-white mb-1 relative z-10">{stats.nodes}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest relative z-10">Concepts Explored</p>
                                    </div>
                                </div>

                                {/* Detailed Activity */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Deep Expansions', value: stats.depth, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                        { label: 'AI Visuals', value: stats.images, icon: Wand2, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                                        { label: 'Focus Time', value: formatDuration(profile.statistics.totalStudyTimeMinutes), icon: Loader2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                                        { label: 'Tiers Unlocked', value: totalUnlockedTiers, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                                    ].map((metric, i) => (
                                        <div key={i} className="nm-flat rounded-3xl p-6 flex flex-col items-center text-center gap-3 hover:scale-105 transition-all duration-300 group">
                                            <div className={`p-3 rounded-xl ${metric.bg} nm-inset-glow group-hover:nm-flat transition-all`}>
                                                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-white mb-0.5">{metric.value}</p>
                                                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{metric.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Objectives & Growth Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Objectives */}
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Current Objectives</h3>
                                            <Target className="h-4 w-4 text-zinc-600" />
                                        </div>
                                        <div className="nm-flat rounded-[2.5rem] p-8 space-y-6">
                                            {[
                                                { label: 'Weekly Map Goal', current: stats.maps % (profile.goals?.weeklyMapGoal || 5), total: profile.goals?.weeklyMapGoal || 5, color: 'bg-blue-500' },
                                                { label: 'Monthly Growth', current: stats.nodes % (profile.goals?.monthlyMapGoal || 50), total: profile.goals?.monthlyMapGoal || 50, color: 'bg-violet-500' }
                                            ].map((goal, i) => (
                                                <div key={i} className="space-y-3">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-zinc-400">{goal.label}</span>
                                                        <span className="text-white">{goal.current}/{goal.total}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full nm-pressed rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${goal.color} rounded-full transition-all duration-1000`}
                                                            style={{ width: `${(goal.current / goal.total) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-4 border-t border-white/5">
                                                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                                                    Goals reset periodically. Keep reaching your milestones to unlock exclusive badges.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Growth Journey */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Growth Journey</h3>
                                            <Badge variant="outline" className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/5 border-none">Rank {totalUnlockedTiers}</Badge>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {ACHIEVEMENT_TIERS.map((ach) => {
                                                const value = stats[ach.category];
                                                const nextTier = ach.tiers.find(t => value < t.requirement) || ach.tiers[ach.tiers.length - 1];
                                                const prevTierMax = ach.tiers.filter(t => value >= t.requirement).pop()?.requirement || 0;
                                                const progress = Math.min(100, Math.max(0, ((value - prevTierMax) / (nextTier.requirement - prevTierMax)) * 100));
                                                return (
                                                    <div key={ach.id} className="nm-flat rounded-3xl p-5 flex items-center gap-4 group hover:nm-pressed transition-all">
                                                        <div className="p-3 nm-inset-glow rounded-xl bg-white/5 shrink-0 group-hover:nm-flat transition-all">
                                                            <ach.icon className="h-5 w-5 text-zinc-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[10px] font-black text-white uppercase tracking-tight truncate">{ach.name}</span>
                                                                <span className="text-[9px] font-bold text-zinc-500">{value}/{nextTier.requirement}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full nm-pressed rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${nextTier.color.replace('text-', 'from-').replace('-400', '-500')} to-violet-500/30`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Identity Section */}
                                <section className="nm-flat rounded-[3rem] p-1">
                                    <div className="nm-inset bg-zinc-900/10 rounded-[2.8rem] p-10">
                                        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-violet-600/20 blur-3xl group-hover:bg-violet-600/30 transition-all rounded-full" />
                                                <Avatar className="h-40 w-40 rounded-[2.5rem] nm-flat p-2 relative">
                                                    <AvatarImage src={profile.photoURL} className="rounded-[2.2rem]" />
                                                    <AvatarFallback className="bg-zinc-900 text-5xl font-black text-violet-400">
                                                        {profile.displayName?.charAt(0)?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="absolute -bottom-2 -right-2 nm-flat p-3 rounded-2xl text-violet-400 hover:nm-pressed transition-all hover:scale-110"
                                                >
                                                    <Pencil className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div className="flex-1 space-y-6">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2 nm-pressed p-1 rounded-2xl">
                                                                <Input
                                                                    value={editName}
                                                                    onChange={(e) => setEditName(e.target.value)}
                                                                    className="h-10 text-3xl font-black bg-transparent border-none focus-visible:ring-0 text-white"
                                                                    autoFocus
                                                                />
                                                                <Button size="icon" variant="outline" onClick={saveDisplayName} className="text-emerald-400 border-none bg-transparent hover:bg-emerald-500/10">
                                                                    <Check className="h-5 w-5" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <h2 className="text-4xl font-black tracking-tight text-white">{profile.displayName}</h2>
                                                        )}
                                                        <Badge className="bg-violet-600/10 text-violet-400 border-none px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest">
                                                            {getActiveBadgeLabel()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xl text-zinc-500 font-medium">{profile.email}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                                    <div className="nm-flat px-6 py-3 rounded-2xl flex flex-col min-w-[200px]">
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Explorer ID</p>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-[11px] font-mono text-white/40 break-all leading-tight">{user.uid}</p>
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-8 w-8 rounded-xl nm-flat hover:nm-pressed bg-transparent border-none text-zinc-500 hover:text-white transition-all shrink-0"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(user.uid);
                                                                    toast({ title: "Copied", description: "Explorer ID copied to clipboard." });
                                                                }}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="nm-flat px-6 py-3 rounded-2xl">
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Initiated In</p>
                                                        <p className="text-sm font-bold text-white/50">{memberSince}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'lab' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Connection Management */}
                                <div className="space-y-8">
                                    <div className="nm-flat rounded-[3rem] p-10 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 nm-pressed rounded-xl">
                                                <Key className="h-6 w-6 text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Engine Access</h3>
                                                <p className="text-sm text-zinc-500">Universal API Integration</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Personal Access Key</Label>
                                                <button onClick={() => setShowApiKey(!showApiKey)} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase">
                                                    {showApiKey ? "Mask Key" : "Reveal Key"}
                                                </button>
                                            </div>
                                            <div className="relative group">
                                                <Input
                                                    type={showApiKey ? "text" : "password"}
                                                    value={apiKeyInput}
                                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                                    className="h-16 nm-pressed bg-zinc-950/20 border-none rounded-2xl px-6 pr-32 font-mono text-sm"
                                                    placeholder="Enter Pollinations Key"
                                                />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                    <Button onClick={handleSaveApiKey} disabled={isSavingKey} className="h-12 px-6 rounded-xl nm-flat hover:nm-pressed text-violet-400 bg-transparent transition-all text-xs font-black uppercase">
                                                        {isSavingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="nm-pressed rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${profile.apiSettings?.pollinationsApiKey ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
                                                <div>
                                                    <p className="text-sm font-bold text-white">{profile.apiSettings?.pollinationsApiKey ? "Authenticated Access" : "Shared Access Mode"}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Connection Status</p>
                                                </div>
                                            </div>
                                            <div className="h-12 w-1 border-r border-white/5 hidden md:block" />
                                            <div className="text-center md:text-right">
                                                <p className="text-2xl font-black text-white">{(pollenBalance || 0).toLocaleString()}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Available Pollen</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="nm-flat rounded-[3rem] p-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 nm-pressed rounded-xl">
                                                <Wand2 className="h-6 w-6 text-pink-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Creative Hub</h3>
                                                <p className="text-sm text-zinc-500">Default Vision Engine</p>
                                            </div>
                                        </div>
                                        <ModelSelector
                                            value={preferredModel}
                                            onChange={handleSaveModelPreference}
                                            className="w-full h-16 nm-pressed border-none rounded-2xl px-6"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* AI Features Checklist */}
                                    <div className="nm-flat rounded-[3rem] p-10 h-full">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-8">System Capabilities</h3>
                                        <div className="space-y-6">
                                            {[
                                                { title: "Priority Queueing", desc: "Skip global processing waits.", icon: Target },
                                                { title: "Ultra High-Res", desc: "Access to 4K upscaled generations.", icon: Sparkles },
                                                { title: "Vision Analytics", desc: "Enhanced multi-modal map expansion.", icon: Brain },
                                                { title: "Secure Tunneling", desc: "Private API requests per instance.", icon: Lock }
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-6 items-start group">
                                                    <div className="p-4 nm-pressed rounded-2xl group-hover:nm-flat transition-all">
                                                        <item.icon className="h-5 w-5 text-violet-400/50" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                                        <p className="text-xs text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="nm-flat rounded-[2.5rem] p-10 space-y-8 group hover:scale-[1.02] transition-all duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-blue-500/10 rounded-2xl nm-inset-glow group-hover:nm-flat transition-all">
                                                <Globe className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Localization</h3>
                                                <p className="text-sm text-zinc-500">System Language</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2">Preferred Language</Label>
                                            <Select value={profile.preferences.preferredLanguage} onValueChange={(v) => savePreference('preferredLanguage', v)}>
                                                <SelectTrigger className="w-full h-16 nm-pressed border-none rounded-2xl px-6 text-sm font-bold bg-zinc-950/20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl">
                                                    {languages.map(l => (
                                                        <SelectItem key={l.code} value={l.code} className="py-3 font-bold">{l.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="nm-flat rounded-[2.5rem] p-10 space-y-8 group hover:scale-[1.02] transition-all duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-violet-500/10 rounded-2xl nm-inset-glow group-hover:nm-flat transition-all">
                                                <Brain className="h-6 w-6 text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Cognitive Tone</h3>
                                                <p className="text-sm text-zinc-500">AI Personality Hub</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2">Interactive Persona</Label>
                                            <Select value={profile.preferences.defaultAIPersona || 'Concise'} onValueChange={(v) => savePreference('defaultAIPersona', v)}>
                                                <SelectTrigger className="w-full h-16 nm-pressed border-none rounded-2xl px-6 text-sm font-bold bg-zinc-950/20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl">
                                                    {['Standard', 'Teacher', 'Concise', 'Creative'].map(p => (
                                                        <SelectItem key={p} value={p} className="py-3 font-bold">{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Extra Preferences */}
                                <div className="nm-flat rounded-[2.5rem] p-10">
                                    <div className="flex items-center gap-2 mb-8">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">System Accessibility</h4>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-3 w-3 text-zinc-700 hover:text-zinc-500 transition-colors" />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-zinc-900 border-zinc-800 text-xs text-zinc-400 p-4 max-w-xs rounded-2xl">
                                                    Configure how MindScape interacts with your workflow, including automation settings and system-level behaviors.
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="flex items-center justify-between gap-6 p-6 nm-pressed rounded-3xl">
                                            <div className="space-y-1">
                                                <p className="font-bold text-white text-sm">Auto-Generate Visuals</p>
                                                <p className="text-xs text-zinc-500">Create icons for every new node.</p>
                                            </div>
                                            <Switch
                                                checked={profile.preferences.autoGenerateImages}
                                                onCheckedChange={(v) => savePreference('autoGenerateImages', v ? 'true' : 'false')}
                                                className="data-[state=checked]:bg-violet-500"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-6 p-6 nm-pressed rounded-3xl">
                                            <div className="space-y-1">
                                                <p className="font-bold text-white text-sm">Deep Expansion Mode</p>
                                                <p className="text-xs text-zinc-500">Go 3 levels deep by default.</p>
                                            </div>
                                            <Switch
                                                checked={profile.preferences.deepExpansionMode}
                                                onCheckedChange={(v) => savePreference('deepExpansionMode', v ? 'true' : 'false')}
                                                className="data-[state=checked]:bg-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="max-w-4xl mx-auto space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="nm-flat rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/5 blur-3xl rounded-full" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="p-4 bg-red-500/10 rounded-2xl nm-inset-glow">
                                                <ShieldCheck className="h-6 w-6 text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Security Shield</h3>
                                                <p className="text-sm text-zinc-500">Authentication Health</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex items-center justify-between p-4 nm-pressed rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Account Type</span>
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-bold">VERIFIED</Badge>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full h-16 nm-flat hover:nm-pressed border-none rounded-2xl text-sm font-black uppercase tracking-[0.2em] text-white bg-zinc-950/20"
                                                onClick={async () => {
                                                    try {
                                                        await sendPasswordResetEmail(auth, profile.email);
                                                        toast({ title: 'Success', description: 'Check email for reset link.' });
                                                    } catch (e: any) {
                                                        toast({ variant: 'destructive', description: e.message });
                                                    }
                                                }}
                                            >
                                                Update Credentials
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="nm-flat rounded-[2.5rem] p-10 space-y-8 group hover:scale-[1.02] transition-all duration-500">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-zinc-500/10 rounded-2xl nm-inset-glow">
                                                <Lock className="h-6 w-6 text-zinc-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Advanced Protection</h3>
                                                <p className="text-sm text-zinc-500">Encryption & Privacy</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-6 nm-pressed rounded-[2.5rem] bg-zinc-950/30">
                                                <p className="text-xs text-zinc-500 leading-relaxed italic">
                                                    MindScape uses industry-standard encryption for all your mind maps and API settings.
                                                    Your personal data is never shared with third-party vendors outside of the required LLM processing.
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between p-4 nm-inset-glow rounded-2xl mt-2 opacity-50">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">2FA Support</span>
                                                <span className="text-[10px] font-black text-zinc-600">COMING SOON</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Log */}
                                <div className="nm-flat rounded-[2.5rem] p-10 flex items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-orange-500/10 rounded-2xl nm-inset-glow">
                                            <Activity className="h-6 w-6 text-orange-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">Instance Status</h4>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Secure & Synced</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active System</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stage Footer */}
                    <footer className="mt-24 pt-12 border-t border-white/5 opacity-30 flex justify-center items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">MindScape Intelligence Hub</span>
                    </footer>
                </div>
            </main>
        </div>
    );
}
