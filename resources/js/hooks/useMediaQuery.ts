import { useState, useEffect } from 'react';

/**
 * Custom hook that tracks whether a CSS media query matches.
 * Uses window.matchMedia API with SSR safety and hydration-aware state.
 *
 * @param query - CSS media query string (e.g., "(max-width: 767px)")
 * @returns boolean indicating whether the media query currently matches
 */
export function useMediaQuery(query: string): boolean {
    // Default to false to avoid hydration mismatch.
    // On the server (SSR) or first client render, we assume the query does not match.
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        // Guard against SSR or environments where window/matchMedia is unavailable
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }

        const mediaQueryList = window.matchMedia(query);

        // Set the initial value after mount (client-only)
        setMatches(mediaQueryList.matches);

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQueryList.addEventListener('change', handleChange);

        return () => {
            mediaQueryList.removeEventListener('change', handleChange);
        };
    }, [query]);

    return matches;
}
