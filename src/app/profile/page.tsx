'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
import { Loader2, User, Settings, Target, FolderHeart, BarChart3, ArrowLeft, Flame, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { StatisticsCard } from '@/components/profile/statistics-card';
import { AchievementBadge } from '@/components/profile/achievement-badge';
import { CalendarHeatmap } from '@/components/profile/calendar-heatmap';
import { TopicChart } from '@/components/profile/topic-chart';
import { ProgressChart } from '@/components/profile/progress-chart';

import {
    UserProfile,
    UserPreferences,
    UserStatistics,
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

import { ACHIEVEMENTS, checkUnlockedAchievements, getAchievementProgress } from '@/lib/achievements';
import { languages } from '@/lib/languages';

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

        loadProfileData();
    }, [user, firestore]);

    const loadProfileData = async () => {
        if (!user || !firestore) return;

        try {
            // Load profile
            const profileDoc = await getDoc(doc(firestore, 'users', user.uid));

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
                // Create default profile
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

            // Load mind maps
            const mapsQuery = query(
                collection(firestore, 'users', user.uid, 'mindmaps')
            );
            const mapsSnapshot = await getDocs(mapsQuery);
            const maps = mapsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMindMaps(maps);

        } catch (error) {
            console.error('Error loading profile:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load profile data',
            });
        } finally {
            setLoading(false);
        }
    };

    const savePreferences = async (newPreferences: UserPreferences) => {
        if (!user || !firestore || !profile) return;

        setSaving(true);
        try {
            await setDoc(
                doc(firestore, 'users', user.uid),
                {
                    preferences: newPreferences,
                },
                { merge: true }
            );

            setProfile({ ...profile, preferences: newPreferences });

            toast({
                title: 'Saved!',
                description: 'Your preferences have been updated',
            });
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save preferences',
            });
        } finally {
            setSaving(false);
        }
    };

    const saveGoals = async (weeklyGoal: number, monthlyGoal: number) => {
        if (!user || !firestore || !profile) return;

        setSaving(true);
        try {
            await setDoc(
                doc(firestore, 'users', user.uid),
                {
                    goals: { weeklyMapGoal: weeklyGoal, monthlyMapGoal: monthlyGoal },
                },
                { merge: true }
            );

            setProfile({ ...profile, goals: { weeklyMapGoal: weeklyGoal, monthlyMapGoal: monthlyGoal } });

            toast({
                title: 'Goals Updated!',
                description: 'Your learning goals have been set',
            });
        } catch (error) {
            console.error('Error saving goals:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save goals',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    // Calculate derived data
    const streak = calculateStreak(activityData);
    const heatmapData = getActivityHeatmapData(activityData);
    const topTopics = getMostExploredTopics(mindMaps);
    const quizAccuracy = calculateQuizAccuracy(profile.statistics);
    const weeklyProgress = getWeeklyProgress(activityData, profile.goals.weeklyMapGoal);
    const monthlyProgress = getMonthlyProgress(activityData, profile.goals.monthlyMapGoal);
    const unlockedAchievements = checkUnlockedAchievements(profile.statistics, profile.achievements);
    const achievementProgress = getAchievementProgress(profile.statistics);

    return (
        <div className="container max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/dashboard')}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Profile</h1>
                    <p className="text-muted-foreground">Manage your learning journey</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                    <TabsTrigger value="overview" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Preferences</span>
                    </TabsTrigger>
                    <TabsTrigger value="goals" className="gap-2">
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline">Goals</span>
                    </TabsTrigger>
                    <TabsTrigger value="collections" className="gap-2">
                        <FolderHeart className="h-4 w-4" />
                        <span className="hidden sm:inline">Collections</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Profile Info */}
                    <Card className="glassmorphism">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                                    {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">{profile.displayName || 'User'}</CardTitle>
                                    <CardDescription>{profile.email}</CardDescription>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="gap-1">
                                            <Trophy className="h-3 w-3" />
                                            {achievementProgress}% Achievements
                                        </Badge>
                                        <Badge variant="secondary" className="gap-1">
                                            <Flame className="h-3 w-3 text-orange-400" />
                                            {streak.currentStreak} Day Streak
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatisticsCard
                            title="Mind Maps Created"
                            value={profile.statistics.totalMapsCreated}
                            icon="Map"
                            subtitle="Total maps"
                            color="purple"
                        />
                        <StatisticsCard
                            title="Nested Expansions"
                            value={profile.statistics.totalNestedExpansions}
                            icon="Network"
                            subtitle="Deep dives"
                            color="blue"
                        />
                        <StatisticsCard
                            title="AI Images Generated"
                            value={profile.statistics.totalImagesGenerated}
                            icon="Image"
                            subtitle="Visual aids"
                            color="pink"
                        />
                        <StatisticsCard
                            title="Quiz Questions"
                            value={profile.statistics.totalQuizQuestions}
                            icon="HelpCircle"
                            subtitle={`${quizAccuracy}% accuracy`}
                            color="green"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatisticsCard
                            title="Study Time"
                            value={formatStudyTime(profile.statistics.totalStudyTimeMinutes)}
                            icon="Clock"
                            subtitle="Total learning time"
                            color="orange"
                        />
                        <StatisticsCard
                            title="Current Streak"
                            value={`${streak.currentStreak} days`}
                            icon="Flame"
                            subtitle={`Longest: ${streak.longestStreak} days`}
                            color="orange"
                        />
                    </div>

                    {/* Recent Achievements */}
                    <Card className="glassmorphism">
                        <CardHeader>
                            <CardTitle>Recent Achievements</CardTitle>
                            <CardDescription>Your latest unlocked badges</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id))
                                    .slice(0, 6)
                                    .map((achievement) => (
                                        <AchievementBadge
                                            key={achievement.id}
                                            {...achievement}
                                            unlocked={true}
                                        />
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-6">
                    <Card className="glassmorphism">
                        <CardHeader>
                            <CardTitle>Learning Preferences</CardTitle>
                            <CardDescription>Customize your learning experience</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Default Explanation Mode</Label>
                                    <Select
                                        value={profile.preferences.defaultExplanationMode}
                                        onValueChange={(value: any) =>
                                            savePreferences({ ...profile.preferences, defaultExplanationMode: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Preferred Language</Label>
                                    <Select
                                        value={profile.preferences.preferredLanguage}
                                        onValueChange={(value) =>
                                            savePreferences({ ...profile.preferences, preferredLanguage: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {languages.map((lang) => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Default AI Persona</Label>
                                    <Select
                                        value={profile.preferences.defaultAIPersona}
                                        onValueChange={(value: any) =>
                                            savePreferences({ ...profile.preferences, defaultAIPersona: value })
                                        }
                                    >
                                        <SelectTrigger>
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

                                <div className="space-y-2">
                                    <Label>Default Mind Map View</Label>
                                    <Select
                                        value={profile.preferences.defaultMapView}
                                        onValueChange={(value: any) =>
                                            savePreferences({ ...profile.preferences, defaultMapView: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expanded">Expanded</SelectItem>
                                            <SelectItem value="collapsed">Collapsed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-generate Images</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically create images for new mind maps
                                    </p>
                                </div>
                                <Switch
                                    checked={profile.preferences.autoGenerateImages}
                                    onCheckedChange={(checked) =>
                                        savePreferences({ ...profile.preferences, autoGenerateImages: checked })
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-6">
                    {/* Goal Settings */}
                    <Card className="glassmorphism">
                        <CardHeader>
                            <CardTitle>Learning Goals</CardTitle>
                            <CardDescription>Set your weekly and monthly targets</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Weekly Mind Map Goal</Label>
                                <Input
                                    type="number"
                                    value={profile.goals.weeklyMapGoal}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setProfile({ ...profile, goals: { ...profile.goals, weeklyMapGoal: value } });
                                    }}
                                    onBlur={() => saveGoals(profile.goals.weeklyMapGoal, profile.goals.monthlyMapGoal)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Monthly Mind Map Goal</Label>
                                <Input
                                    type="number"
                                    value={profile.goals.monthlyMapGoal}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setProfile({ ...profile, goals: { ...profile.goals, monthlyMapGoal: value } });
                                    }}
                                    onBlur={() => saveGoals(profile.goals.weeklyMapGoal, profile.goals.monthlyMapGoal)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="glassmorphism">
                            <CardHeader>
                                <CardTitle>Weekly Progress</CardTitle>
                                <CardDescription>
                                    {weeklyProgress.current} / {weeklyProgress.goal} maps
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress value={weeklyProgress.percentage} className="h-2" />
                                <p className="text-sm text-muted-foreground mt-2">
                                    {weeklyProgress.percentage}% complete
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glassmorphism">
                            <CardHeader>
                                <CardTitle>Monthly Progress</CardTitle>
                                <CardDescription>
                                    {monthlyProgress.current} / {monthlyProgress.goal} maps
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress value={monthlyProgress.percentage} className="h-2" />
                                <p className="text-sm text-muted-foreground mt-2">
                                    {monthlyProgress.percentage}% complete
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* All Achievements */}
                    <Card className="glassmorphism">
                        <CardHeader>
                            <CardTitle>All Achievements</CardTitle>
                            <CardDescription>
                                {unlockedAchievements.length} / {ACHIEVEMENTS.length} unlocked
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {ACHIEVEMENTS.map((achievement) => (
                                    <AchievementBadge
                                        key={achievement.id}
                                        {...achievement}
                                        unlocked={unlockedAchievements.includes(achievement.id)}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Collections Tab */}
                <TabsContent value="collections" className="space-y-6">
                    <Card className="glassmorphism">
                        <CardHeader>
                            <CardTitle>Collections</CardTitle>
                            <CardDescription>Coming soon - organize your mind maps into custom collections</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <FolderHeart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Collections feature will be available in the next update</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                    {/* Calendar Heatmap */}
                    <Card className="glassmorphism">
                        <CardHeader>
                            <CardTitle>Activity Calendar</CardTitle>
                            <CardDescription>Your learning activity over the past year</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CalendarHeatmap data={heatmapData} />
                        </CardContent>
                    </Card>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glassmorphism">
                            <CardHeader>
                                <CardTitle>Topic Distribution</CardTitle>
                                <CardDescription>Your most explored topics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TopicChart data={topTopics} />
                            </CardContent>
                        </Card>

                        <Card className="glassmorphism">
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
            </Tabs>
        </div>
    );
}
