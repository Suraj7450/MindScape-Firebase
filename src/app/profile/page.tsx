'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, setDoc, collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { updateProfile, signOut } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    Loader2, ArrowLeft, Flame, Map, Brain, LogOut, Settings, Globe, Wand2,
    Pencil, Check, X, Trophy, Target, Lock, ChevronRight, Eye, EyeOff, Key
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { languages } from '@/lib/languages';
import { format } from 'date-fns';

// Types
interface UserProfile {
    displayName: string;
    email: string;
    photoURL?: string;
    preferences: {
        preferredLanguage: string;
        defaultAIPersona: string;
    };
    statistics: {
        currentStreak: number;
        totalQuizQuestions: number;
    };
    apiSettings?: {
        useCustomApiKey: boolean;
        customApiKey?: string;
    };
}

// Achievement definitions
interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
    check: (stats: { maps: number; questions: number; streak: number }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_map',
        name: 'First Steps',
        description: 'Create your first mind map',
        icon: Map,
        gradient: 'from-blue-500 to-cyan-400',
        check: (stats) => stats.maps >= 1,
    },
    {
        id: 'explorer',
        name: 'Explorer',
        description: 'Create 5 mind maps',
        icon: Target,
        gradient: 'from-violet-500 to-purple-400',
        check: (stats) => stats.maps >= 5,
    },
    {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Answer 10 quiz questions',
        icon: Brain,
        gradient: 'from-emerald-500 to-green-400',
        check: (stats) => stats.questions >= 10,
    },
    {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: '7-day streak',
        icon: Flame,
        gradient: 'from-orange-500 to-amber-400',
        check: (stats) => stats.streak >= 7,
    },
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

    // API Key State
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [useCustomKey, setUseCustomKey] = useState(false);
    const [hasStoredKey, setHasStoredKey] = useState(false);
    const [isSavingApiKey, setIsSavingApiKey] = useState(false);

    // Load profile data
    useEffect(() => {
        if (!user || !firestore) {
            setLoading(false);
            return;
        }

        let unsubscribeProfile: (() => void) | null = null;

        const setupListeners = async () => {
            try {
                // Set up real-time listener for profile
                const userRef = doc(firestore, 'users', user.uid);
                unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const profileData = {
                            displayName: data.displayName || user.displayName || 'User',
                            email: data.email || user.email || '',
                            photoURL: data.photoURL || user.photoURL,
                            preferences: {
                                preferredLanguage: data.preferences?.preferredLanguage || 'en',
                                defaultAIPersona: data.preferences?.defaultAIPersona || 'Standard',
                            },
                            statistics: {
                                currentStreak: data.statistics?.currentStreak || 0,
                                totalQuizQuestions: data.statistics?.totalQuizQuestions || 0,
                            },
                            apiSettings: {
                                useCustomApiKey: data.apiSettings?.useCustomApiKey || false,
                            }
                        };
                        setProfile(profileData);
                        setEditName(profileData.displayName);
                        setUseCustomKey(data.apiSettings?.useCustomApiKey || false);
                        setHasStoredKey(data.apiSettings?.hasStoredKey || false);
                    } else {
                        const defaultData: UserProfile = {
                            displayName: user.displayName || 'User',
                            email: user.email || '',
                            photoURL: user.photoURL || undefined,
                            preferences: { preferredLanguage: 'en', defaultAIPersona: 'Standard' },
                            statistics: { currentStreak: 0, totalQuizQuestions: 0 },
                        };
                        setProfile(defaultData);
                        setEditName(defaultData.displayName);
                        setUseCustomKey(false);
                        setHasStoredKey(false);
                    }
                    setLoading(false);
                }, (error) => {
                    // Ignore permission errors that happen during logout
                    if (error.code !== 'permission-denied') {
                        console.error("Profile snapshot error:", error);
                    }
                });

                // Get active maps count (one-time fetch)
                const mapsQuery = query(collection(firestore, 'users', user.uid, 'mindmaps'));
                const mapsSnapshot = await getDocs(mapsQuery);
                setActiveMapsCount(mapsSnapshot.size);

            } catch (error) {
                console.error('Error loading profile:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load profile' });
                setLoading(false);
            }
        };

        setupListeners();

        return () => {
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
        };
    }, [user, firestore, toast]);

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

    // Save API key securely via Cloud Function
    const saveApiKey = async () => {
        if (!user || !apiKeyInput.trim()) return;
        setIsSavingApiKey(true);
        try {
            const functions = getFunctions();
            const storeUserApiKey = httpsCallable(functions, 'storeUserApiKey');
            await storeUserApiKey({ apiKey: apiKeyInput.trim() });

            setUseCustomKey(true);
            setHasStoredKey(true);
            setApiKeyInput(''); // Clear input after secure storage
            toast({ title: 'Secure', description: 'API key encrypted and stored securely.' });
        } catch (error: any) {
            console.error('Error storing API key:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to save API key'
            });
        } finally {
            setIsSavingApiKey(false);
        }
    };

    // Toggle custom API key usage via Cloud Function
    const toggleApiKeyUsage = async (useCustom: boolean) => {
        if (!user) return;
        try {
            const functions = getFunctions();
            const toggleCustomApiKey = httpsCallable(functions, 'toggleCustomApiKey');
            await toggleCustomApiKey({ useCustomKey: useCustom });

            setUseCustomKey(useCustom);
            toast({ title: 'Updated', description: useCustom ? 'Using your custom API key.' : 'Using default API key.' });
        } catch (error: any) {
            console.error('Error toggling API key:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update settings'
            });
        }
    };

    // Delete stored API key via Cloud Function
    const deleteApiKey = async () => {
        if (!user) return;
        try {
            const functions = getFunctions();
            const deleteUserApiKey = httpsCallable(functions, 'deleteUserApiKey');
            await deleteUserApiKey({});

            setUseCustomKey(false);
            setHasStoredKey(false);
            setApiKeyInput('');
            toast({ title: 'Deleted', description: 'API key removed.' });
        } catch (error: any) {
            console.error('Error deleting API key:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete API key' });
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
        maps: activeMapsCount,
        questions: profile.statistics.totalQuizQuestions,
        streak: profile.statistics.currentStreak,
    };
    const unlockedCount = ACHIEVEMENTS.filter(a => a.check(stats)).length;

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-gradient-to-b from-violet-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />

            <div className="relative max-w-md mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-zinc-400 hover:text-white -ml-2">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <span className="text-xs text-zinc-500">Profile</span>
                </div>

                {/* Profile Hero */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl blur-2xl" />
                    <Card className="relative bg-zinc-900/90 border-zinc-800 rounded-2xl overflow-hidden">
                        <CardContent className="p-5">
                            {/* Avatar & Info Row */}
                            <div className="flex items-start gap-4 mb-5">
                                <div className="relative shrink-0">
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full blur-sm" />
                                    <Avatar className="relative h-16 w-16 ring-2 ring-zinc-900">
                                        <AvatarImage src={profile.photoURL} />
                                        <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-xl font-bold">
                                            {profile.displayName?.charAt(0)?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    {isEditing ? (
                                        <div className="flex gap-1.5">
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="h-8 text-sm bg-zinc-800 border-zinc-700"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveDisplayName();
                                                    if (e.key === 'Escape') { setIsEditing(false); setEditName(profile.displayName); }
                                                }}
                                            />
                                            <Button size="icon" variant="ghost" onClick={saveDisplayName} disabled={isSaving} className="h-8 w-8 text-emerald-400">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => { setIsEditing(false); setEditName(profile.displayName); }} className="h-8 w-8 text-zinc-400">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 group">
                                            <h1 className="text-lg font-bold text-white truncate">{profile.displayName}</h1>
                                            <button onClick={() => setIsEditing(true)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-opacity">
                                                <Pencil className="h-3 w-3 text-zinc-500" />
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
                                    <p className="text-[10px] text-zinc-600 mt-1">Joined {memberSince}</p>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                                    <Map className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                                    <p className="text-xl font-bold text-white">{stats.maps}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Maps</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                                    <Brain className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                                    <p className="text-xl font-bold text-white">{stats.questions}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Quiz</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                                    <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                                    <p className="text-xl font-bold text-white">{stats.streak}</p>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Streak</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Achievements */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-medium text-white">Achievements</span>
                        </div>
                        <span className="text-xs text-zinc-500">{unlockedCount}/{ACHIEVEMENTS.length}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {ACHIEVEMENTS.map((ach) => {
                            const unlocked = ach.check(stats);
                            const Icon = ach.icon;
                            return (
                                <div
                                    key={ach.id}
                                    className={`
                                        relative p-3 rounded-xl text-center transition-all
                                        ${unlocked
                                            ? 'bg-zinc-800/80 ring-1 ring-white/10'
                                            : 'bg-zinc-900/50 opacity-40'
                                        }
                                    `}
                                    title={ach.description}
                                >
                                    <div className={`
                                        w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-1.5
                                        ${unlocked ? `bg-gradient-to-br ${ach.gradient}` : 'bg-zinc-800'}
                                    `}>
                                        {unlocked ? (
                                            <Icon className="h-5 w-5 text-white" />
                                        ) : (
                                            <Lock className="h-4 w-4 text-zinc-600" />
                                        )}
                                    </div>
                                    <p className={`text-[10px] font-medium truncate ${unlocked ? 'text-white' : 'text-zinc-600'}`}>
                                        {ach.name}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Settings */}
                <Card className="bg-zinc-900/90 border-zinc-800 rounded-2xl mb-6">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-zinc-500" />
                            <CardTitle className="text-sm font-medium text-white">Settings</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-1">
                        {/* Language */}
                        <div className="flex items-center justify-between py-2.5 group">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-blue-500/10">
                                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                                </div>
                                <span className="text-sm text-zinc-300">Language</span>
                            </div>
                            <Select value={profile.preferences.preferredLanguage} onValueChange={(v) => savePreference('preferredLanguage', v)}>
                                <SelectTrigger className="w-28 h-8 text-xs bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator className="bg-zinc-800" />

                        {/* AI Persona */}
                        <div className="flex items-center justify-between py-2.5">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-purple-500/10">
                                    <Wand2 className="h-3.5 w-3.5 text-purple-400" />
                                </div>
                                <span className="text-sm text-zinc-300">AI Style</span>
                            </div>
                            <Select value={profile.preferences.defaultAIPersona} onValueChange={(v) => savePreference('defaultAIPersona', v)}>
                                <SelectTrigger className="w-28 h-8 text-xs bg-zinc-800 border-zinc-700">
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

                        <Separator className="bg-zinc-800" />

                        {/* API Configuration */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between py-2.5">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-md bg-emerald-500/10">
                                        <Key className="h-3.5 w-3.5 text-emerald-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-zinc-300">Custom API Key</span>
                                        <span className="text-[10px] text-zinc-500">
                                            {hasStoredKey ? '🔐 Key stored securely' : 'Use your own Gemini API key'}
                                        </span>
                                    </div>
                                </div>
                                <Switch
                                    checked={useCustomKey}
                                    onCheckedChange={toggleApiKeyUsage}
                                    disabled={!hasStoredKey}
                                />
                            </div>

                            {/* API Key Input - always shown when custom key toggle is on OR no key stored yet */}
                            <div className="mt-2 mb-2 space-y-2">
                                <div className="relative">
                                    <Input
                                        type={showApiKey ? "text" : "password"}
                                        value={apiKeyInput}
                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                        placeholder={hasStoredKey ? "Enter new key to replace..." : "Enter Gemini API Key"}
                                        className="bg-zinc-800 border-zinc-700 text-xs pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                    >
                                        {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={saveApiKey}
                                        disabled={!apiKeyInput.trim() || isSavingApiKey}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                                    >
                                        {isSavingApiKey ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Key className="h-3 w-3 mr-1" />}
                                        {hasStoredKey ? 'Update Key' : 'Save & Encrypt'}
                                    </Button>
                                    {hasStoredKey && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={deleteApiKey}
                                            className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[9px] text-zinc-600">
                                    Your key is encrypted with AES-256 and stored on our secure servers. We never store keys in plain text.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <button
                    onClick={handleLogout}
                    className="w-full py-3 rounded-xl text-sm font-medium text-red-400 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                    <LogOut className="h-4 w-4" />
                    Log Out
                </button>

                <p className="text-center text-[10px] text-zinc-700 mt-6">MindScape</p>
            </div>
        </div >
    );
}
