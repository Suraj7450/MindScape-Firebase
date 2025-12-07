// Activity tracking utilities for updating user statistics

import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { format } from 'date-fns';

/**
 * Update user statistics in Firestore
 */
export async function updateUserStatistics(
    firestore: Firestore,
    userId: string,
    updates: {
        mapsCreated?: number;
        nestedExpansions?: number;
        imagesGenerated?: number;
        quizQuestions?: number;
        quizCorrectAnswers?: number;
        studyTimeMinutes?: number;
    }
) {
    const userRef = doc(firestore, 'users', userId);
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
        // Update statistics
        const statisticsUpdates: any = {};
        if (updates.mapsCreated) statisticsUpdates['statistics.totalMapsCreated'] = increment(updates.mapsCreated);
        if (updates.nestedExpansions) statisticsUpdates['statistics.totalNestedExpansions'] = increment(updates.nestedExpansions);
        if (updates.imagesGenerated) statisticsUpdates['statistics.totalImagesGenerated'] = increment(updates.imagesGenerated);
        if (updates.quizQuestions) statisticsUpdates['statistics.totalQuizQuestions'] = increment(updates.quizQuestions);
        if (updates.quizCorrectAnswers) statisticsUpdates['statistics.quizCorrectAnswers'] = increment(updates.quizCorrectAnswers);
        if (updates.studyTimeMinutes) statisticsUpdates['statistics.totalStudyTimeMinutes'] = increment(updates.studyTimeMinutes);

        statisticsUpdates['statistics.lastActiveDate'] = today;

        await setDoc(userRef, statisticsUpdates, { merge: true });

        // Update daily activity
        const activityUpdates: any = {};
        if (updates.mapsCreated) activityUpdates[`activity.${today}.mapsCreated`] = increment(updates.mapsCreated);
        if (updates.nestedExpansions) activityUpdates[`activity.${today}.expansionsMade`] = increment(updates.nestedExpansions);
        if (updates.imagesGenerated) activityUpdates[`activity.${today}.imagesGenerated`] = increment(updates.imagesGenerated);
        if (updates.quizQuestions) activityUpdates[`activity.${today}.quizQuestions`] = increment(updates.quizQuestions);
        if (updates.studyTimeMinutes) activityUpdates[`activity.${today}.studyTimeMinutes`] = increment(updates.studyTimeMinutes);

        await setDoc(userRef, activityUpdates, { merge: true });

        // Update streak
        await updateStreak(firestore, userId, today);
    } catch (error) {
        console.error('Error updating user statistics:', error);
    }
}

/**
 * Update learning streak
 */
async function updateStreak(firestore: Firestore, userId: string, today: string) {
    const userRef = doc(firestore, 'users', userId);

    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;

        const data = userDoc.data();
        const lastActiveDate = data.statistics?.lastActiveDate;
        const currentStreak = data.statistics?.currentStreak || 0;
        const longestStreak = data.statistics?.longestStreak || 0;

        if (!lastActiveDate || lastActiveDate === today) {
            // First activity or same day
            const newStreak = lastActiveDate === today ? currentStreak : 1;
            await setDoc(
                userRef,
                {
                    statistics: {
                        currentStreak: newStreak,
                        longestStreak: Math.max(newStreak, longestStreak),
                    },
                },
                { merge: true }
            );
            return;
        }

        // Calculate days difference
        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date(today);
        const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = currentStreak;
        if (daysDiff === 1) {
            // Consecutive day
            newStreak = currentStreak + 1;
        } else if (daysDiff > 1) {
            // Streak broken
            newStreak = 1;
        }

        await setDoc(
            userRef,
            {
                statistics: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, longestStreak),
                },
            },
            { merge: true }
        );
    } catch (error) {
        console.error('Error updating streak:', error);
    }
}

/**
 * Track mind map creation
 */
export async function trackMapCreated(firestore: Firestore, userId: string) {
    await updateUserStatistics(firestore, userId, { mapsCreated: 1 });
}

/**
 * Track nested expansion
 */
export async function trackNestedExpansion(firestore: Firestore, userId: string) {
    await updateUserStatistics(firestore, userId, { nestedExpansions: 1 });
}

/**
 * Track image generation
 */
export async function trackImageGenerated(firestore: Firestore, userId: string) {
    await updateUserStatistics(firestore, userId, { imagesGenerated: 1 });
}

/**
 * Track quiz question answered
 */
export async function trackQuizQuestion(
    firestore: Firestore,
    userId: string,
    isCorrect: boolean
) {
    await updateUserStatistics(firestore, userId, {
        quizQuestions: 1,
        quizCorrectAnswers: isCorrect ? 1 : 0,
    });
}

/**
 * Track study time (call periodically)
 */
export async function trackStudyTime(firestore: Firestore, userId: string, minutes: number) {
    await updateUserStatistics(firestore, userId, { studyTimeMinutes: minutes });
}

/**
 * Initialize user profile with default values
 */
export async function initializeUserProfile(
    firestore: Firestore,
    userId: string,
    displayName: string,
    email: string,
    photoURL?: string
) {
    const userRef = doc(firestore, 'users', userId);
    const today = format(new Date(), 'yyyy-MM-dd');

    const defaultProfile = {
        displayName,
        email,
        photoURL: photoURL || null,
        preferences: {
            defaultExplanationMode: 'Intermediate',
            preferredLanguage: 'en',
            defaultAIPersona: 'Standard',
            autoGenerateImages: false,
            defaultMapView: 'collapsed',
            autoSaveFrequency: 5,
        },
        statistics: {
            totalMapsCreated: 0,
            totalNestedExpansions: 0,
            totalImagesGenerated: 0,
            totalQuizQuestions: 0,
            quizCorrectAnswers: 0,
            totalStudyTimeMinutes: 0,
            lastActiveDate: today,
            currentStreak: 0,
            longestStreak: 0,
        },
        goals: {
            weeklyMapGoal: 5,
            monthlyMapGoal: 20,
        },
        achievements: [],
        collections: {},
        recentlyViewed: [],
        activity: {},
    };

    await setDoc(userRef, defaultProfile, { merge: true });
}
