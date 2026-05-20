import { useCallback, useRef } from 'react';

/**
 * Custom hook to prevent rapid double-clicks/taps on elements.
 * Re-runs are blocked until the specified delay period concludes.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 600
): (...args: Parameters<T>) => void {
    const isCurrentlyLocked = useRef(false);

    return useCallback((...args: Parameters<T>) => {
        // If locked, drop the click gesture completely
        if (isCurrentlyLocked.current) return;

        // Execute the actual press action
        callback(...args);

        // Immediately lock the callback
        isCurrentlyLocked.current = true;

        // Release the lock after the delay expires
        setTimeout(() => {
            isCurrentlyLocked.current = false;
        }, delay);
    }, [callback, delay]);
}
