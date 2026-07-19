import { RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Breakpoint di mana kolom disembunyikan secara responsif */
    responsiveHidden?: 'mobile' | 'tablet' | 'mobile-tablet';
    /** Class tambahan untuk cell */
    cellClassName?: string;
  }
}
