// Achievement definitions and unlock logic for MindScape

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (stats: UserStatistics) => boolean;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserStatistics {
    totalMapsCreated: number;
    totalNestedExpansions: number;
    totalImagesGenerated: number;
    totalQuizQuestions: number;
    quizCorrectAnswers: number;
    totalStudyTimeMinutes: number;
    currentStreak: number;
    longestStreak: number;
}

export const ACHIEVEMENTS: Achievement[] = [
    // Getting Started
    {
        id: 'first_map',
        name: 'First Steps',
        description: 'Create your first mind map',
        icon: 'map',
        tier: 'bronze',
        condition: (stats) => stats.totalMapsCreated >= 1,
    },
    {
        id: 'explorer',
        name: 'Explorer',
        description: 'Create 10 mind maps',
        icon: 'compass',
        tier: 'silver',
        condition: (stats) => stats.totalMapsCreated >= 10,
    },
    {
        id: 'cartographer',
        name: 'Cartographer',
        description: 'Create 50 mind maps',
        icon: 'map-pin',
        tier: 'gold',
        condition: (stats) => stats.totalMapsCreated >= 50,
    },
    {
        id: 'master_mapper',
        name: 'Master Mapper',
        description: 'Create 100 mind maps',
        icon: 'globe',
        tier: 'platinum',
        condition: (stats) => stats.totalMapsCreated >= 100,
    },

    // Streaks
    {
        id: 'consistent_learner',
        name: 'Consistent Learner',
        description: 'Maintain a 7-day learning streak',
        icon: 'flame',
        tier: 'bronze',
        condition: (stats) => stats.currentStreak >= 7,
    },
    {
        id: 'dedicated_student',
        name: 'Dedicated Student',
        description: 'Maintain a 30-day learning streak',
        icon: 'zap',
        tier: 'silver',
        condition: (stats) => stats.currentStreak >= 30,
    },
    {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Maintain a 100-day learning streak',
        icon: 'award',
        tier: 'gold',
        condition: (stats) => stats.currentStreak >= 100,
    },

    // Deep Learning
    {
        id: 'deep_thinker',
        name: 'Deep Thinker',
        description: 'Create 10 nested expansions',
        icon: 'network',
        tier: 'bronze',
        condition: (stats) => stats.totalNestedExpansions >= 10,
    },
    {
        id: 'mind_architect',
        name: 'Mind Architect',
        description: 'Create 50 nested expansions',
        icon: 'git-branch',
        tier: 'silver',
        condition: (stats) => stats.totalNestedExpansions >= 50,
    },
    {
        id: 'knowledge_weaver',
        name: 'Knowledge Weaver',
        description: 'Create 200 nested expansions',
        icon: 'share-2',
        tier: 'gold',
        condition: (stats) => stats.totalNestedExpansions >= 200,
    },

    // Visual Learning
    {
        id: 'visual_learner',
        name: 'Visual Learner',
        description: 'Generate 10 AI images',
        icon: 'image',
        tier: 'bronze',
        condition: (stats) => stats.totalImagesGenerated >= 10,
    },
    {
        id: 'art_enthusiast',
        name: 'Art Enthusiast',
        description: 'Generate 50 AI images',
        icon: 'palette',
        tier: 'silver',
        condition: (stats) => stats.totalImagesGenerated >= 50,
    },
    {
        id: 'visual_master',
        name: 'Visual Master',
        description: 'Generate 200 AI images',
        icon: 'sparkles',
        tier: 'gold',
        condition: (stats) => stats.totalImagesGenerated >= 200,
    },

    // Quiz Mastery
    {
        id: 'quiz_novice',
        name: 'Quiz Novice',
        description: 'Answer 50 quiz questions',
        icon: 'help-circle',
        tier: 'bronze',
        condition: (stats) => stats.totalQuizQuestions >= 50,
    },
    {
        id: 'quiz_expert',
        name: 'Quiz Expert',
        description: 'Answer 200 quiz questions',
        icon: 'brain',
        tier: 'silver',
        condition: (stats) => stats.totalQuizQuestions >= 200,
    },
    {
        id: 'quiz_master',
        name: 'Quiz Master',
        description: 'Answer 500 quiz questions with 80%+ accuracy',
        icon: 'trophy',
        tier: 'gold',
        condition: (stats) =>
            stats.totalQuizQuestions >= 500 &&
            stats.quizCorrectAnswers / stats.totalQuizQuestions >= 0.8,
    },

    // Study Time
    {
        id: 'focused_learner',
        name: 'Focused Learner',
        description: 'Spend 10 hours studying',
        icon: 'clock',
        tier: 'bronze',
        condition: (stats) => stats.totalStudyTimeMinutes >= 600,
    },
    {
        id: 'dedicated_scholar',
        name: 'Dedicated Scholar',
        description: 'Spend 50 hours studying',
        icon: 'book-open',
        tier: 'silver',
        condition: (stats) => stats.totalStudyTimeMinutes >= 3000,
    },
    {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Spend 100 hours studying',
        icon: 'graduation-cap',
        tier: 'gold',
        condition: (stats) => stats.totalStudyTimeMinutes >= 6000,
    },
];

/**
 * Check which achievements a user has unlocked based on their statistics
 */
export function checkUnlockedAchievements(
    stats: UserStatistics,
    currentAchievements: string[]
): string[] {
    const unlockedIds = ACHIEVEMENTS.filter((achievement) =>
        achievement.condition(stats)
    ).map((a) => a.id);

    return unlockedIds;
}

/**
 * Get newly unlocked achievements (not in current list)
 */
export function getNewlyUnlockedAchievements(
    stats: UserStatistics,
    currentAchievements: string[]
): Achievement[] {
    const allUnlocked = checkUnlockedAchievements(stats, currentAchievements);
    const newIds = allUnlocked.filter((id) => !currentAchievements.includes(id));
    return ACHIEVEMENTS.filter((a) => newIds.includes(a.id));
}

/**
 * Get achievement progress percentage
 */
export function getAchievementProgress(stats: UserStatistics): number {
    const unlocked = checkUnlockedAchievements(stats, []);
    return Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);
}
