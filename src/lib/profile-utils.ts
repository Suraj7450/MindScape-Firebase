// Utility functions for profile statistics and analytics

import { format, subDays, differenceInDays, parseISO } from 'date-fns';

export interface UserProfile {
    displayName: string;
    email: string;
    photoURL?: string;
    preferences: UserPreferences;
    statistics: UserStatistics;
    goals: UserGoals;
    achievements: string[];
    collections: Record<string, Collection>;
    recentlyViewed: string[];
}

export interface UserPreferences {
    defaultExplanationMode: 'Beginner' | 'Intermediate' | 'Expert';
    preferredLanguage: string;
    defaultAIPersona: 'Standard' | 'Teacher' | 'Concise' | 'Creative';
    autoGenerateImages: boolean;
    defaultMapView: 'expanded' | 'collapsed';
    autoSaveFrequency: number; // in minutes
}

export interface UserStatistics {
    totalMapsCreated: number;
    totalNestedExpansions: number;
    totalImagesGenerated: number;
    totalStudyTimeMinutes: number;
    lastActiveDate: string; // YYYY-MM-DD
    currentStreak: number;
    longestStreak: number;
}

export interface UserGoals {
    weeklyMapGoal: number;
    monthlyMapGoal: number;
}

export interface Collection {
    name: string;
    mapIds: string[];
    createdAt: number;
}

export interface DailyActivity {
    mapsCreated: number;
    expansionsMade: number;
    imagesGenerated: number;
    studyTimeMinutes: number;
}

/**
 * Calculate learning streak based on activity data
 */
export function calculateStreak(
    activityData: Record<string, DailyActivity>
): { currentStreak: number; longestStreak: number } {
    const today = format(new Date(), 'yyyy-MM-dd');
    const dates = Object.keys(activityData).sort().reverse();

    if (dates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = today;

    while (true) {
        if (activityData[checkDate] && hasActivity(activityData[checkDate])) {
            currentStreak++;
            checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
        } else if (checkDate === today) {
            // If no activity today, check yesterday
            checkDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        } else {
            break;
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: string | null = null;

    for (const date of dates) {
        if (!hasActivity(activityData[date])) continue;

        if (prevDate === null) {
            tempStreak = 1;
        } else {
            const daysDiff = differenceInDays(parseISO(prevDate), parseISO(date));
            if (daysDiff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }

        prevDate = date;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
}

/**
 * Check if a day has any activity
 */
function hasActivity(activity: DailyActivity): boolean {
    return (
        activity.mapsCreated > 0 ||
        activity.expansionsMade > 0 ||
        activity.imagesGenerated > 0 ||
        activity.studyTimeMinutes > 0
    );
}

/**
 * Get activity data for the last N days (for heatmap)
 */
export function getActivityHeatmapData(
    activityData: Record<string, DailyActivity>,
    days: number = 365
): Array<{ date: string; count: number }> {
    const result: Array<{ date: string; count: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        const activity = activityData[date];

        // Calculate activity score (weighted sum)
        const count = activity
            ? activity.mapsCreated * 5 +
            activity.expansionsMade * 2 +
            activity.imagesGenerated * 1 +
            activity.studyTimeMinutes * 0.1
            : 0;

        result.push({ date, count: Math.round(count) });
    }

    return result;
}

/**
 * Get most explored topics from mind maps
 */
export function getMostExploredTopics(
    mindMaps: Array<{ topic: string }>
): Array<{ topic: string; count: number }> {
    const topicCounts: Record<string, number> = {};

    mindMaps.forEach((map) => {
        const topic = map.topic.toLowerCase();
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    return Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}


/**
 * Format study time in human-readable format
 */
export function formatStudyTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours < 24) {
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Get default user preferences
 */
export function getDefaultPreferences(): UserPreferences {
    return {
        defaultExplanationMode: 'Intermediate',
        preferredLanguage: 'en',
        defaultAIPersona: 'Concise',
        autoGenerateImages: false,
        defaultMapView: 'collapsed',
        autoSaveFrequency: 5,
    };
}

/**
 * Get default user statistics
 */
export function getDefaultStatistics(): UserStatistics {
    return {
        totalMapsCreated: 0,
        totalNestedExpansions: 0,
        totalImagesGenerated: 0,
        totalStudyTimeMinutes: 0,
        lastActiveDate: format(new Date(), 'yyyy-MM-dd'),
        currentStreak: 0,
        longestStreak: 0,
    };
}

/**
 * Get default user goals
 */
export function getDefaultGoals(): UserGoals {
    return {
        weeklyMapGoal: 5,
        monthlyMapGoal: 20,
    };
}

/**
 * Calculate progress towards weekly goal
 */
export function getWeeklyProgress(
    activityData: Record<string, DailyActivity>,
    weeklyGoal: number
): { current: number; goal: number; percentage: number } {
    const today = new Date();
    let mapsThisWeek = 0;

    for (let i = 0; i < 7; i++) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        if (activityData[date]) {
            mapsThisWeek += activityData[date].mapsCreated;
        }
    }

    return {
        current: mapsThisWeek,
        goal: weeklyGoal,
        percentage: Math.min(Math.round((mapsThisWeek / weeklyGoal) * 100), 100),
    };
}

/**
 * Calculate progress towards monthly goal
 */
export function getMonthlyProgress(
    activityData: Record<string, DailyActivity>,
    monthlyGoal: number
): { current: number; goal: number; percentage: number } {
    const today = new Date();
    let mapsThisMonth = 0;

    for (let i = 0; i < 30; i++) {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        if (activityData[date]) {
            mapsThisMonth += activityData[date].mapsCreated;
        }
    }

    return {
        current: mapsThisMonth,
        goal: monthlyGoal,
        percentage: Math.min(Math.round((mapsThisMonth / monthlyGoal) * 100), 100),
    };
}
