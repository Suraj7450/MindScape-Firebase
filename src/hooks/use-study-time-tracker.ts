// React hook for tracking study time on mind map page

import { useEffect, useRef } from 'react';
import { Firestore } from 'firebase/firestore';
import { trackStudyTime } from '@/lib/activity-tracker';

/**
 * Hook to track study time spent on a page
 * Tracks time in 1-minute intervals
 */
export function useStudyTimeTracker(
    firestore: Firestore | null,
    userId: string | undefined,
    isActive: boolean = true
) {
    const startTimeRef = useRef<number>(Date.now());
    const accumulatedTimeRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!firestore || !userId || !isActive) {
            return;
        }

        // Reset start time when component mounts or becomes active
        startTimeRef.current = Date.now();
        accumulatedTimeRef.current = 0;

        // Track time every minute
        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsedMinutes = Math.floor((now - startTimeRef.current) / (1000 * 60));

            if (elapsedMinutes > 0) {
                trackStudyTime(firestore, userId, elapsedMinutes);
                accumulatedTimeRef.current += elapsedMinutes;
                startTimeRef.current = now;
            }
        }, 60000); // Check every minute

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // Track any remaining time on unmount
            const now = Date.now();
            const elapsedMinutes = Math.floor((now - startTimeRef.current) / (1000 * 60));
            if (elapsedMinutes > 0 && firestore && userId) {
                trackStudyTime(firestore, userId, elapsedMinutes);
            }
        };
    }, [firestore, userId, isActive]);

    // Track time when page visibility changes
    useEffect(() => {
        if (!firestore || !userId || !isActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Page hidden - track accumulated time
                const now = Date.now();
                const elapsedMinutes = Math.floor((now - startTimeRef.current) / (1000 * 60));
                if (elapsedMinutes > 0) {
                    trackStudyTime(firestore, userId, elapsedMinutes);
                    accumulatedTimeRef.current += elapsedMinutes;
                }
            } else {
                // Page visible again - reset start time
                startTimeRef.current = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [firestore, userId, isActive]);
}
