import { useMemo } from 'react';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Hook that computes a VisibilityState object based on the current viewport
 * breakpoint and each column's `meta.responsiveHidden` configuration.
 *
 * Logic:
 * - `responsiveHidden: 'mobile'` → hidden when viewport < 768px
 * - `responsiveHidden: 'tablet'` → hidden when viewport < 1024px (includes mobile)
 * - `responsiveHidden: 'mobile-tablet'` → same as 'tablet', semantic alias
 *
 * The returned VisibilityState can be merged as a base into react-table's
 * columnVisibility state, allowing user overrides on top.
 *
 * @param columns - The column definitions array passed to react-table
 * @returns VisibilityState object mapping column IDs to visibility booleans
 */
export function useResponsiveColumns<TData>(
    columns: ColumnDef<TData, any>[]
): VisibilityState {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const isTablet = useMediaQuery('(max-width: 1023px)');

    const visibilityState = useMemo(() => {
        const state: VisibilityState = {};

        for (const column of columns) {
            const id = column.id ?? (column as any).accessorKey;
            if (!id) continue;

            const responsiveHidden = (column.meta as any)?.responsiveHidden as
                | 'mobile'
                | 'tablet'
                | 'mobile-tablet'
                | undefined;

            if (!responsiveHidden) continue;

            switch (responsiveHidden) {
                case 'mobile':
                    // Hide only on mobile (< 768px)
                    state[id] = !isMobile;
                    break;
                case 'tablet':
                case 'mobile-tablet':
                    // Hide on tablet and below (< 1024px), which includes mobile
                    state[id] = !isTablet;
                    break;
            }
        }

        return state;
    }, [columns, isMobile, isTablet]);

    return visibilityState;
}
