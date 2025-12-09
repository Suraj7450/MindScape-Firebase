'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc, setDoc, collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Loader2, User, Settings, Target, BarChart3, ArrowLeft, Flame, Trophy,
    Map, Network, Image, Brain, Clock, Sparkles, Mail, Shield, LayoutDashboard,
    Zap, Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { StatisticsCard } from '@/components/profile/statistics-card';
import { AchievementBadge } from '@/components/profile/achievement-badge';
import { CalendarHeatmap } from '@/components/profile/calendar-heatmap';
import { TopicChart } from '@/components/profile/topic-chart';
import { ProgressChart } from '@/components/profile/progress-chart';

import {
    UserProfile,
    UserPreferences,
    DailyActivity,
    getDefaultPreferences,
    getDefaultStatistics,
    getDefaultGoals,
    calculateStreak,
    getActivityHeatmapData,
    getMostExploredTopics,
    calculateQuizAccuracy,
    formatStudyTime,
    getWeeklyProgress,
    getMonthlyProgress,
} from '@/lib/profile-utils';

import { ACHIEVEMENTS, checkUnlockedAchievements, getAchievementProgress, getNewlyUnlockedAchievements } from '@/lib/achievements';
import { languages } from '@/lib/languages';

const CATEGORIES: Record<string, { label: string; icon: any; color: string }> = {
    Creation: { label: 'Map Verification', icon: Map, color: 'text-purple-400' },
    Consistency: { label: 'Streaks & Consistency', icon: Flame, color: 'text-orange-400' },
    Exploration: { label: 'Deep Diving', icon: Network, color: 'text-blue-400' },
    Visualization: { label: 'Visual Learning', icon: Image, color: 'text-pink-400' },
    Knowledge: { label: 'Quiz Mastery', icon: Brain, color: 'text-green-400' },
    Dedication: { label: 'Study Time', icon: Clock, color: 'text-amber-400' },
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, firestore } = useFirebase();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activityData, setActivityData] = useState<Record<string, DailyActivity>>({});
    const [mindMaps, setMindMaps] = useState<any[]>([]);

    // Load profile data
    useEffect(() => {
        if (!user || !firestore) {
            router.push('/login');
            return;
        }

        let unsubscribe: (() => void) | undefined;
        loadProfileData().then((cleanup) => {
            unsubscribe = cleanup;
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, firestore]);

    const loadProfileData = async () => {
        if (!user || !firestore) return;

        try {
            // Set up real-time listener for profile data
            const userDocRef = doc(firestore, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (profileDoc) => {
                if (profileDoc.exists()) {
                    const data = profileDoc.data();
                    setProfile({
                        displayName: data.displayName || user.displayName || '',
                        email: data.email || user.email || '',
                        photoURL: data.photoURL || user.photoURL,
                        preferences: data.preferences || getDefaultPreferences(),
                        statistics: data.statistics || getDefaultStatistics(),
                        goals: data.goals || getDefaultGoals(),
                        achievements: data.achievements || [],
                        collections: data.collections || {},
                        recentlyViewed: data.recentlyViewed || [],
                    });
                    setActivityData(data.activity || {});
                } else {
                    const defaultProfile: UserProfile = {
                        displayName: user.displayName || '',
                        email: user.email || '',
                        photoURL: user.photoURL,
                        preferences: getDefaultPreferences(),
                        statistics: getDefaultStatistics(),
                        goals: getDefaultGoals(),
                        achievements: [],
                        collections: {},
                        recentlyViewed: [],
                    };
                    setProfile(defaultProfile);
                }
                setLoading(false);
            }, (error) => {
                console.error('Error loading profile:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load profile data' });
                setLoading(false);
            });

            // Load mind maps (one-time fetch)
            const mapsQuery = query(collection(firestore, 'users', user.uid, 'mindmaps'));
            const mapsSnapshot = await getDocs(mapsQuery);
            const maps = mapsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMindMaps(maps);

            // Reconcile maps count: compare actual count with stored statistics
            const actualMapsCount = maps.length;
            const reconcileDocRef = doc(firestore, 'users', user.uid);
            const userDocSnap = await getDoc(reconcileDocRef);

            if (userDocSnap.exists()) {
                const storedCount = userDocSnap.data().statistics?.totalMapsCreated || 0;

                if (storedCount !== actualMapsCount) {
                    console.warn(`Maps count mismatch: stored=${storedCount}, actual=${actualMapsCount}. Reconciling...`);

                    // Update stored count to match actual
                    await setDoc(reconcileDocRef, {
                        statistics: {
                            totalMapsCreated: actualMapsCount
                        }
                    }, { merge: true });

                    toast({
                        title: 'Statistics Updated',
                        description: `Corrected maps count from ${storedCount} to ${actualMapsCount}`,
                    });
                }
            }

            // Return cleanup function
            return unsubscribe;
        } catch (error) {
            console.error('Error setting up profile listener:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load profile data' });
            setLoading(false);
        }
    };

    // Check for new achievements (optimized with memoization)
    const processedAchievementsRef = useRef<Set<string>>(new Set());

    const newAchievements = useMemo(() => {
        if (!profile) return [];
        const unlockedIds = profile.achievements.map(a => a.id);
        return getNewlyUnlockedAchievements(profile.statistics, unlockedIds);
    }, [profile?.statistics.totalMapsCreated, profile?.statistics.totalNestedExpansions, profile?.statistics.totalImagesGenerated, profile?.statistics.totalQuizQuestions, profile?.statistics.currentStreak]);

    useEffect(() => {
        if (!profile || !user || !firestore || newAchievements.length === 0) return;

        // Filter out already processed achievements
        const unprocessedAchievements = newAchievements.filter(
            a => !processedAchievementsRef.current.has(a.id)
        );

        if (unprocessedAchievements.length === 0) return;

        const newUnlockData = unprocessedAchievements.map(a => ({
            id: a.id,
            unlockedAt: Date.now()
        }));

        const updatedAchievements = [...profile.achievements, ...newUnlockData];

        // Persist
        setDoc(doc(firestore, 'users', user.uid), {
            achievements: updatedAchievements
        }, { merge: true }).then(() => {
            // Toast for each (debounced to prevent spam)
            unprocessedAchievements.forEach((achievement, index) => {
                setTimeout(() => {
                    toast({
                        title: "New Achievement Unlocked! 🏆",
                        description: achievement.name,
                        className: "bg-gradient-to-r from-yellow-900/80 to-amber-900/80 border-amber-500/50 text-amber-100",
                    });
                }, index * 500); // 500ms delay between toasts
            });

            // Mark as processed
            unprocessedAchievements.forEach(a => processedAchievementsRef.current.add(a.id));

            // Update local
            setProfile(prev => prev ? ({ ...prev, achievements: updatedAchievements }) : null);
        }).catch(err => console.error("Error unlocking achievements:", err));
    }, [newAchievements, user, firestore, toast]);

    const savePreferences = async (newPreferences: UserPreferences) => {
        if (!user || !firestore || !profile) return;
        setSaving(true);
        try {
            await setDoc(doc(firestore, 'users', user.uid), { preferences: newPreferences }, { merge: true });
            setProfile({ ...profile, preferences: newPreferences });
            toast({ title: 'Saved', description: 'Preferences updated' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save preferences' });
        } finally {
            setSaving(false);
        }
    };

    const saveGoals = async (weeklyGoal: number, monthlyGoal: number) => {
        if (!user || !firestore || !profile) return;
        setSaving(true);
        try {
            await setDoc(doc(firestore, 'users', user.uid), { goals: { weeklyMapGoal: weeklyGoal, monthlyMapGoal: monthlyGoal } }, { merge: true });
            setProfile({ ...profile, goals: { weeklyMapGoal: weeklyGoal, monthlyMapGoal: monthlyGoal } });
            toast({ title: 'Goals Updated', description: 'Learning targets set' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save goals' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-purple-500" /></div>;
    if (!profile) return null;

    // Use stored streak values as single source of truth (updated by activity-tracker)
    const streak = {
        currentStreak: profile.statistics.currentStreak,
        longestStreak: profile.statistics.longestStreak
    };
    const heatmapData = getActivityHeatmapData(activityData);
    const topTopics = getMostExploredTopics(mindMaps);
    const quizAccuracy = calculateQuizAccuracy(profile.statistics);
    const weeklyProgress = getWeeklyProgress(activityData, profile.goals.weeklyMapGoal);
    const monthlyProgress = getMonthlyProgress(activityData, profile.goals.monthlyMapGoal);
    const unlockedAchievements = checkUnlockedAchievements(profile.statistics, profile.achievements);
    const achievementProgress = getAchievementProgress(profile.statistics);

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold">Back to Dashboard</h1>
            </div>

            {/* Premium Profile Header */}
            <div className="relative mb-8 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 border border-white/10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white/5 bg-zinc-900/80 flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text text-transparent shadow-2xl shrink-0">
                        {profile.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{profile.displayName}</h1>
                        <p className="text-zinc-400 flex items-center justify-center md:justify-start gap-2">
                            <Mail className="h-3.5 w-3.5" /> {profile.email}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                            <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 px-3 py-1">
                                <Shield className="h-3 w-3 mr-1.5 text-emerald-400" /> Pro Account
                            </Badge>
                            <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 px-3 py-1">
                                <Trophy className="h-3 w-3 mr-1.5 text-yellow-400" /> {Math.floor(profile.statistics.totalMapsCreated / 10) + 1} Level
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-6 md:gap-8 px-6 py-4 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-0.5">{streak.currentStreak}</div>
                            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Streak</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-0.5">{achievementProgress}%</div>
                            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Trophies</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-0.5">{profile.statistics.totalMapsCreated}</div>
                            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Maps</div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="w-full justify-start border-b border-white/10 bg-transparent p-0 h-auto rounded-none gap-6">
                    <TabsTrigger
                        value="overview"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-violet-500 data-[state=active]:bg-transparent data-[state=active]:text-violet-400 hover:text-white transition-colors"
                    >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="achievements"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-fuchsia-500 data-[state=active]:bg-transparent data-[state=active]:text-fuchsia-400 hover:text-white transition-colors"
                    >
                        <Trophy className="h-4 w-4 mr-2" />
                        Achievements
                    </TabsTrigger>
                    <TabsTrigger
                        value="analytics"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 hover:text-white transition-colors"
                    >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger
                        value="settings"
                        className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-zinc-500 data-[state=active]:bg-transparent data-[state=active]:text-zinc-400 hover:text-white transition-colors"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* OVERVIEW DASHBOARD */}
                <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatisticsCard 
                            title="Total Content" 
                            value={profile.statistics.totalMapsCreated + profile.statistics.totalNestedExpansions} 
                            icon="Sparkles" 
                            subtitle="Maps + Sub-Maps" 
                            color="purple" 
                        />
                        <StatisticsCard title="Mind Maps" value={profile.statistics.totalMapsCreated} icon="Map" subtitle="Main Topics" color="blue" />
                        <StatisticsCard title="Study Hours" value={formatStudyTime(profile.statistics.totalStudyTimeMinutes)} icon="Clock" subtitle="Dedicated Time" color="orange" />
                        <StatisticsCard title="Quiz Avg" value={`${quizAccuracy}%`} icon="Brain" subtitle="Knowledge Retention" color="green" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Interaction Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">Activity Overview</CardTitle>
                                            <CardDescription>Your learning consistency visualization</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="border-green-500/20 text-green-400 bg-green-500/10">Active</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <CalendarHeatmap data={heatmapData} />
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-amber-400" /> Weekly Values
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-400">Map Creation Goal</span>
                                                <span className="text-white font-medium">{weeklyProgress.current} / {weeklyProgress.goal}</span>
                                            </div>
                                            <Progress value={weeklyProgress.percentage} className="h-1.5" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-400" /> Monthly Values
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-400">Map Creation Goal</span>
                                                <span className="text-white font-medium">{monthlyProgress.current} / {monthlyProgress.goal}</span>
                                            </div>
                                            <Progress value={monthlyProgress.percentage} className="h-1.5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Recent & Quick Stats */}
                        <div className="space-y-8">
                            <Card className="bg-black/20 border-white/5 backdrop-blur-sm h-full">
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Badges</CardTitle>
                                    <CardDescription>Latest unlocked achievements</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id)).slice(0, 4).map(achievement => (
                                            <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300">
                                                    {React.createElement(CATEGORIES[achievement.category as string]?.icon || Trophy, { className: "h-4 w-4" })}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{achievement.name}</p>
                                                    <p className="text-xs text-zinc-400 truncate">{achievement.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {unlockedAchievements.length === 0 && (
                                            <div className="text-center py-8 text-zinc-500 text-sm">No achievements yet. Start learning!</div>
                                        )}
                                    </div>
                                    <Button variant="ghost" className="w-full mt-4 text-xs text-zinc-400 hover:text-white" onClick={() => {
                                        const tabs = document.querySelector('[role="tablist"]');
                                        const trigger = tabs?.querySelector('[value="achievements"]') as HTMLElement;
                                        trigger?.click();
                                    }}>
                                        View All Achievements
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* ACHIEVEMENTS TAB */}
                <TabsContent value="achievements" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(CATEGORIES).map(([cat, info]) => {
                            const catAch = ACHIEVEMENTS.filter(a => a.category === cat);
                            const unlocked = catAch.filter(a => unlockedAchievements.includes(a.id)).length;
                            const progress = (unlocked / catAch.length) * 100;
                            return (
                                <Card key={cat} className="bg-black/20 border-white/5 backdrop-blur-sm">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`p-3 rounded-xl bg-white/5 ${info.color}`}>
                                            <info.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm font-medium text-zinc-200">{info.label}</span>
                                                <span className="text-xs text-zinc-400">{unlocked}/{catAch.length}</span>
                                            </div>
                                            <Progress value={progress} className="h-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {Object.entries(CATEGORIES).map(([category, info]) => {
                        const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
                        const Icon = info.icon;
                        return (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <Icon className={`h-5 w-5 ${info.color}`} />
                                    <h2 className="text-lg font-semibold text-white">{info.label}</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {categoryAchievements.map((achievement) => (
                                        <AchievementBadge
                                            key={achievement.id}
                                            {...achievement}
                                            // @ts-ignore
                                            tier={achievement.tier}
                                            unlocked={unlockedAchievements.includes(achievement.id)}
                                            // @ts-ignore
                                            unlockedAt={profile.achievements.find(a => a.id === achievement.id)?.unlockedAt}
                                            progress={achievement.progress ? achievement.progress(profile.statistics) : undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </TabsContent>

                {/* ANALYTICS TAB */}
                <TabsContent value="analytics" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Topic Distribution</CardTitle>
                                <CardDescription>Your most explored topics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TopicChart data={topTopics} />
                            </CardContent>
                        </Card>

                        <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Progress Over Time</CardTitle>
                                <CardDescription>Mind maps created in the last 30 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ProgressChart activityData={activityData} days={30} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Learning Preferences</CardTitle>
                            <CardDescription>Customize your AI learning experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Default Explanation Mode</Label>
                                    <Select value={profile.preferences.defaultExplanationMode} onValueChange={(v: any) => savePreferences({ ...profile.preferences, defaultExplanationMode: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Preferred Language</Label>
                                    <Select value={profile.preferences.preferredLanguage} onValueChange={(v) => savePreferences({ ...profile.preferences, preferredLanguage: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {languages.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>AI Persona</Label>
                                    <Select value={profile.preferences.defaultAIPersona} onValueChange={(v: any) => savePreferences({ ...profile.preferences, defaultAIPersona: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="Teacher">Teacher</SelectItem>
                                            <SelectItem value="Concise">Concise</SelectItem>
                                            <SelectItem value="Creative">Creative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mind Map View</Label>
                                    <Select value={profile.preferences.defaultMapView} onValueChange={(v: any) => savePreferences({ ...profile.preferences, defaultMapView: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expanded">Expanded</SelectItem>
                                            <SelectItem value="collapsed">Collapsed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-generate Images</Label>
                                    <p className="text-sm text-muted-foreground">Automatically create images for new maps</p>
                                </div>
                                <Switch checked={profile.preferences.autoGenerateImages} onCheckedChange={(c) => savePreferences({ ...profile.preferences, autoGenerateImages: c })} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/20 border-white/5 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Learning Goals</CardTitle>
                            <CardDescription>Set your activity targets</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Weekly Mind Maps</Label>
                                    <Input type="number" value={profile.goals.weeklyMapGoal} onChange={(e) => setProfile({ ...profile, goals: { ...profile.goals, weeklyMapGoal: parseInt(e.target.value) || 0 } })} onBlur={() => saveGoals(profile.goals.weeklyMapGoal, profile.goals.monthlyMapGoal)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Monthly Mind Maps</Label>
                                    <Input type="number" value={profile.goals.monthlyMapGoal} onChange={(e) => setProfile({ ...profile, goals: { ...profile.goals, monthlyMapGoal: parseInt(e.target.value) || 0 } })} onBlur={() => saveGoals(profile.goals.weeklyMapGoal, profile.goals.monthlyMapGoal)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
