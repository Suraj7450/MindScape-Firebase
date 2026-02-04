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
    Pencil, Check, X, Trophy, Target, Lock, ChevronRight, Sparkles, Copy, Key, HelpCircle
} from 'lucide-react';
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
import { Eye, EyeOff } from 'lucide-react';
import { getUserImageSettings, saveUserApiKey } from '@/lib/firestore-helpers';

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
        provider?: 'pollinations' | 'bytez';
        imageProvider?: 'pollinations' | 'bytez';
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
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'activity'>('overview');
    const [isSyncing, setIsSyncing] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [preferredModel, setPreferredModel] = useState('flux');
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');



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
                                defaultAIPersona: data.preferences?.defaultAIPersona || 'Standard',
                                defaultExplanationMode: data.preferences?.defaultExplanationMode,
                                autoGenerateImages: data.preferences?.autoGenerateImages,
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
                                defaultAIPersona: 'Standard',
                                autoGenerateImages: false,
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
    const getActiveMode = (): 'default' | 'pollinations' | 'bytez' => {
        if (profile?.apiSettings?.provider === 'pollinations') return 'pollinations';
        if (profile?.apiSettings?.provider === 'bytez') return 'bytez';
        return 'default';
    };
    const activeMode = getActiveMode();

    const getActiveImageMode = (): 'pollinations' | 'bytez' => {
        if (profile?.apiSettings?.imageProvider === 'bytez') return 'bytez';
        return 'pollinations';
    };
    const activeImageMode = getActiveImageMode();

    const setAIConfig = async (mode: 'pollinations') => {
        if (!user || !firestore) return;
        try {
            if (mode === 'pollinations') {
                await setDoc(doc(firestore, 'users', user.uid), {
                    apiSettings: { provider: 'pollinations' }
                }, { merge: true });
            } else if (mode === 'bytez') {
                await setDoc(doc(firestore, 'users', user.uid), {
                    apiSettings: { provider: 'bytez' }
                }, { merge: true });
            }

            toast({
                title: 'Updated',
                description: `AI Provider set to ${mode === 'pollinations' ? 'Pollinations' : 'Bytez'}`
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

    const handleSaveApiKey = async () => {
        if (!user || !firestore) return;
        setIsSavingKey(true);
        try {
            await saveUserApiKey(firestore, user.uid, apiKeyInput, preferredModel);
            toast({ title: 'API Key Saved', description: 'Your personal access key has been updated.' });
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
        { id: 'overview', label: 'Overview', icon: Brain },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500/30">
            {/* Premium background mesh */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] bg-fuchsia-600/10 blur-[100px] rounded-full animate-pulse [animation-delay:2s]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-600/10 blur-[90px] rounded-full animate-pulse [animation-delay:4s]" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-500" />
                            <Avatar className="relative h-24 w-24 rounded-2xl ring-4 ring-zinc-950">
                                <AvatarImage src={profile.photoURL} />
                                <AvatarFallback className="bg-zinc-900 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-violet-400 to-fuchsia-400">
                                    {profile.displayName?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="h-10 text-xl font-bold bg-zinc-900/50 border-zinc-800 w-48"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveDisplayName();
                                                if (e.key === 'Escape') { setIsEditing(false); setEditName(profile.displayName); }
                                            }}
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveDisplayName} disabled={isSaving} className="text-emerald-400">
                                            <Check className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-bold tracking-tight">{profile.displayName}</h1>
                                        <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-lg hover:bg-zinc-800/50 text-zinc-500 transition-colors">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                                <Badge variant="secondary" className="bg-violet-500/10 text-violet-400 border-violet-500/20 px-3 py-0.5 animate-pulse">
                                    {getActiveBadgeLabel()}
                                </Badge>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-zinc-500 font-medium">{profile.email}</p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.uid);
                                        toast({ title: 'Copied', description: 'UID copied to clipboard' });
                                    }}
                                    className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1.5"
                                >
                                    UID: {user.uid}
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Copy className="h-3 w-3" />
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {user?.providerData.some(p => p.providerId === 'password') && (
                            <Button
                                variant="outline"
                                className="h-10 border-zinc-800 text-zinc-400 hover:text-white hover:bg-white/5 gap-2"
                                onClick={async () => {
                                    if (!user?.email) return;
                                    try {
                                        await sendPasswordResetEmail(auth!, user.email);
                                        toast({ title: 'Reset email sent', description: 'Check your inbox for instructions.' });
                                    } catch (e: any) {
                                        toast({ variant: 'destructive', title: 'Error', description: e.message });
                                    }
                                }}
                            >
                                <Key className="h-4 w-4" /> Reset Password
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="h-10 border-orange-500/20 text-orange-400 hover:bg-orange-500/5 gap-2"
                            onClick={handleSyncStatus}
                            disabled={isSyncing}
                        >
                            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {isSyncing ? 'Sync Data' : 'Sync Data'}
                        </Button>
                        <Button onClick={handleLogout} variant="outline" className="h-10 border-red-500/20 text-red-400 hover:bg-red-500/5 gap-2">
                            <LogOut className="h-4 w-4" /> Log Out
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
                    {/* Sidebar Nav */}
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                        ${isActive
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}
                                    `}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                    {isActive && <ChevronRight className="ml-auto h-4 w-4 animate-in fade-in slide-in-from-left-2" />}
                                </button>
                            );
                        })}

                    </nav>

                    {/* Main Content Area */}
                    <main className="min-h-[500px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Overview Grid - Row 1: Core Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl group hover:border-violet-500/30 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-4">
                                                <Map className="h-6 w-6 text-blue-400" />
                                            </div>
                                            <p className="text-2xl font-bold text-white mb-1">{stats.maps}</p>
                                            <p className="text-sm text-zinc-500">Mind Maps Generated</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl group hover:border-orange-500/30 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="p-3 bg-orange-500/10 rounded-xl w-fit mb-4">
                                                <Flame className="h-6 w-6 text-orange-400" />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl font-bold text-white mb-1">
                                                    {stats.streak} {stats.streak === 1 ? 'Day' : 'Days'}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 font-medium">Record: {profile.statistics.longestStreak || 0}</p>
                                            </div>
                                            <p className="text-sm text-zinc-500">Active Streak</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl group hover:border-amber-500/30 transition-colors">
                                        <CardContent className="p-6">
                                            <div className="p-3 bg-amber-500/10 rounded-xl w-fit mb-4">
                                                <Trophy className="h-6 w-6 text-amber-400" />
                                            </div>
                                            <p className="text-2xl font-bold text-white mb-1">{totalUnlockedTiers}</p>
                                            <p className="text-sm text-zinc-500">Tier Levels Unlocked</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Overview Grid - Row 2: Extended Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Study Time', value: formatDuration(profile.statistics.totalStudyTimeMinutes), icon: Loader2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                                        { label: 'Depth Level', value: stats.depth, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                        { label: 'Visual Assets', value: stats.images, icon: Wand2, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                                        { label: 'Total Nodes', value: stats.nodes, icon: Brain, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                                    ].map((metric, i) => (
                                        <Card key={i} className="bg-zinc-900/20 border-zinc-800/40 hover:border-zinc-700/60 transition-colors">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${metric.bg}`}>
                                                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-bold text-white leading-none mb-1">{metric.value}</p>
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{metric.label}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Achievements Detailed */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Growth Path</h2>
                                        <Badge variant="outline" className="text-zinc-500 border-zinc-800">
                                            Progress Tracker
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {ACHIEVEMENT_TIERS.map((ach) => {
                                            const value = stats[ach.category];
                                            const highestUnlockedTier = [...ach.tiers].reverse().find(t => value >= t.requirement);
                                            const nextTier = ach.tiers.find(t => value < t.requirement);
                                            const progress = nextTier
                                                ? Math.min(100, (value / nextTier.requirement) * 100)
                                                : 100;

                                            const Icon = ach.icon;

                                            return (
                                                <Card key={ach.id} className="bg-zinc-900/20 border-zinc-800/50 overflow-hidden group hover:border-zinc-700/50 transition-all">
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start justify-between mb-6">
                                                            <div className="flex gap-4">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-zinc-900 border border-zinc-800 group-hover:border-violet-500/30 transition-colors`}>
                                                                    <Icon className={`h-6 w-6 ${highestUnlockedTier ? highestUnlockedTier.color : 'text-zinc-600'}`} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-lg font-bold text-white">{ach.name}</p>
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <HelpCircle className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-400 cursor-help transition-opacity opacity-0 group-hover:opacity-100" />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 text-[10px] py-1.5 px-3">
                                                                                    {ach.description}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>
                                                                    <p className="text-xs text-zinc-500">{nextTier ? `Next: ${nextTier.label} (${value}/${nextTier.requirement})` : 'Max Level Reached'}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Tier Dots/Status */}
                                                        <div className="flex gap-4 mb-6">
                                                            {ach.tiers.map((tier) => {
                                                                const isUnlocked = value >= tier.requirement;
                                                                const isEquipped = profile.activeBadgeId === `${ach.id}:${tier.level}`;
                                                                return (
                                                                    <button
                                                                        key={tier.level}
                                                                        disabled={!isUnlocked}
                                                                        onClick={() => equipBadge(`${ach.id}:${tier.level}`)}
                                                                        className={`
                                                                        flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all
                                                                        ${isUnlocked
                                                                                ? isEquipped
                                                                                    ? `bg-violet-600/20 border-violet-500/50 ${tier.shadow}`
                                                                                    : `bg-zinc-900/50 border-zinc-800 hover:border-zinc-600`
                                                                                : 'bg-zinc-950/50 border-zinc-900 opacity-40 cursor-not-allowed'}
                                                                    `}
                                                                    >
                                                                        <div className={`text-[10px] font-bold uppercase tracking-tighter ${isUnlocked ? tier.color : 'text-zinc-600'}`}>
                                                                            {tier.label}
                                                                        </div>
                                                                        {isEquipped ? (
                                                                            <Check className="h-3 w-3 text-violet-400" />
                                                                        ) : isUnlocked ? (
                                                                            <Sparkles className="h-3 w-3 text-zinc-500" />
                                                                        ) : (
                                                                            <Lock className="h-3 w-3 text-zinc-700" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                                                                <span>Progression</span>
                                                                <span>{Math.round(progress)}%</span>
                                                            </div>
                                                            <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-1000 ease-out"
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Growth Analytics */}
                                <div className="pt-10 mt-10 border-t border-zinc-900/50">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 rounded-lg bg-violet-500/10">
                                            <Flame className="h-4 w-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Growth Analytics</h2>
                                            <p className="text-[10px] text-zinc-500 font-medium">Visualizing your learning velocity</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Session Velocity</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-20 flex items-end gap-1.5 pt-2">
                                                    {[40, 70, 45, 90, 65, 30, 85].map((h, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex-1 bg-gradient-to-t from-violet-600/20 to-violet-500/60 rounded-t-sm hover:to-violet-400 transition-all cursor-crosshair"
                                                            style={{ height: `${h}%` }}
                                                        />
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-sm">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Topic Diversity</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4 pt-2">
                                                {[
                                                    { label: 'Technology', val: 85, color: 'bg-blue-400' },
                                                    { label: 'Creative', val: 65, color: 'bg-violet-400' },
                                                ].map((cluster, i) => (
                                                    <div key={i} className="space-y-1.5">
                                                        <div className="flex justify-between text-[10px] items-center">
                                                            <span className="font-bold text-zinc-500 uppercase tracking-tighter">{cluster.label}</span>
                                                            <span className="font-mono text-zinc-400">{cluster.val}%</span>
                                                        </div>
                                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                            <div className={`h-full ${cluster.color} opacity-60 transition-all duration-1000`} style={{ width: `${cluster.val}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Profile Details */}
                                <Card className="bg-zinc-900/40 border-zinc-800 pb-2">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">Account Preferences</CardTitle>
                                        <CardDescription>Personalize your MindScape experience</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                                    <Globe className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Interface Language</p>
                                                    <p className="text-xs text-zinc-500">Set your preferred UI language</p>
                                                </div>
                                            </div>
                                            <Select value={profile.preferences.preferredLanguage} onValueChange={(v) => savePreference('preferredLanguage', v)}>
                                                <SelectTrigger className="w-36 h-9 bg-zinc-900/50 border-zinc-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {languages.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                                    <Wand2 className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">AI Persona</p>
                                                    <p className="text-xs text-zinc-500">Choice of AI interaction style</p>
                                                </div>
                                            </div>
                                            <Select value={profile.preferences.defaultAIPersona} onValueChange={(v) => savePreference('defaultAIPersona', v)}>
                                                <SelectTrigger className="w-36 h-9 bg-zinc-900/50 border-zinc-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Standard">Standard</SelectItem>
                                                    <SelectItem value="Teacher">Teacher</SelectItem>
                                                    <SelectItem value="Concise">Concise</SelectItem>
                                                    <SelectItem value="Creative">Creative</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* AI & Engine Configuration - Universal for all AI operations */}
                                <Card className="bg-zinc-900/40 border-zinc-800">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">AI & Engine Configuration</CardTitle>
                                        <CardDescription>Manage your AI providers and integration keys</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                    <Sparkles className="h-4 w-4 text-emerald-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">AI Engine</p>
                                                    <p className="text-xs text-zinc-500">MindScape is powered by Pollinations AI</p>
                                                </div>
                                                <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5">Active</Badge>
                                            </div>
                                        </div>

                                        {profile.apiSettings?.pollinationsApiKey && (
                                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                                    <span className="text-emerald-400 font-medium">Personal API Key Connected</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1 ml-4">
                                                    Using your own Pollinations API key for all AI operations (text, images, and more)
                                                </p>
                                            </div>
                                        )}

                                        {!profile.apiSettings?.pollinationsApiKey && (
                                            <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                                    <span className="text-zinc-400 font-medium">Using Server API Key</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1 ml-4">
                                                    Connect your personal key below for unlimited access
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-zinc-800 space-y-6">
                                            {/* API Key Management */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Universal API Key</Label>
                                                    <button
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                        className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
                                                    >
                                                        {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                        {showApiKey ? 'Hide Key' : 'Show Key'}
                                                    </button>
                                                </div>

                                                <div className="relative group">
                                                    <Input
                                                        type={showApiKey ? "text" : "password"}
                                                        value={apiKeyInput}
                                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                                        className="bg-zinc-950/50 border-zinc-800 text-zinc-300 font-mono text-xs pr-24 focus-visible:ring-violet-500/50"
                                                        placeholder="Enter your Pollinations API Key"
                                                    />
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                if (apiKeyInput) {
                                                                    navigator.clipboard.writeText(apiKeyInput);
                                                                    toast({ title: 'Copied', description: 'API key copied back to clipboard' });
                                                                }
                                                            }}
                                                            className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                                                            title="Copy Key"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-[10px] font-bold uppercase tracking-wider bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/40"
                                                            onClick={handleSaveApiKey}
                                                            disabled={isSavingKey}
                                                        >
                                                            {isSavingKey ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-zinc-500 italic">
                                                    This key is used for all AI operations across MindScape.
                                                </p>
                                            </div>

                                            {/* Preferred Model Section */}
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Default Image Model</Label>
                                                <ModelSelector
                                                    value={preferredModel}
                                                    onChange={handleSaveModelPreference}
                                                    className="w-full bg-zinc-950/50 border-zinc-800 h-10"
                                                />
                                                <p className="text-[10px] text-zinc-500 italic">
                                                    Choose your preferred image generation model.
                                                </p>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-xs text-zinc-400 mb-4">
                                                    Get or rotate your API key at{' '}
                                                    <a
                                                        href="https://enter.pollinations.ai"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-violet-400 hover:text-violet-300 underline font-medium"
                                                    >
                                                        enter.pollinations.ai
                                                    </a>
                                                </p>
                                                <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-tighter">
                                                            <HelpCircle className="h-3.5 w-3.5" />
                                                            Personal Pollen Benefits
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2 text-[11px] text-zinc-400">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-violet-500" />
                                                                <span className="text-zinc-300">Unlimited Usage:</span> High-priority queue access
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-violet-500" />
                                                                <span className="text-zinc-300">Advanced Models:</span> Access to FLUX.2 Klein and more
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-violet-500" />
                                                                <span className="text-zinc-300">Private:</span> Keys stored locally and encrypted
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Minimalist footer */}
            <footer className="relative max-w-6xl mx-auto px-4 py-12 border-t border-zinc-900 mt-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase">MindScape</p>
                    <div className="flex gap-8 text-[10px] font-medium uppercase tracking-widest">
                        <span>Private</span>
                        <span>Secure</span>
                        <span>Open Source</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
