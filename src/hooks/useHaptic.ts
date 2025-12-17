import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const patterns: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 25,
    heavy: 50,
    success: [10, 50, 10],
    error: [50, 100, 50],
};

/**
 * Hook for triggering haptic feedback on mobile devices
 * Uses the Vibration API when available
 */
export const useHaptic = () => {
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    const trigger = useCallback((pattern: HapticPattern = 'light') => {
        if (!isSupported) return false;

        try {
            navigator.vibrate(patterns[pattern]);
            return true;
        } catch {
            return false;
        }
    }, [isSupported]);

    return { trigger, isSupported };
};
