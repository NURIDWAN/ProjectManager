import { useEffect, useState, useMemo } from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    RowSelectionState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    Column,
} from '@tanstack/react-table';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    SlidersHorizontal,
    Search,
    X,
    Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchValue?: string;
    searchPlaceholder?: string;
    pageSize?: number;
    pageSizeOptions?: number[];
    enableRowSelection?: boolean;
    enableColumnVisibility?: boolean;
    enableGlobalFilter?: boolean;
    /**
     * When true, the DataTable's internal pagination footer is hidden because
     * pagination is handled server-side by the page (e.g. via Inertia links).
     * Prevents duplicate page navigation UIs on the same page.
     */
    serverSide?: boolean;
    onRowSelectionChange?: (selectedRows: TData[]) => void;
    toolbar?: React.ReactNode;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchValue,
    searchPlaceholder = 'Cari...',
    pageSize = 10,
    pageSizeOptions = [5, 10, 20, 50],
    enableRowSelection = false,
    enableColumnVisibility = true,
    enableGlobalFilter = false,
    serverSide = false,
    onRowSelectionChange,
    toolbar,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [globalFilter, setGlobalFilter] = useState('');

    // Compute responsive visibility based on breakpoints and column meta
    const responsiveVisibility = useResponsiveColumns(columns);

    // Merge: responsive as base, user state overrides
    const mergedVisibility = useMemo(
        () => ({ ...responsiveVisibility, ...columnVisibility }),
        [responsiveVisibility, columnVisibility]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        enableRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility: mergedVisibility,
            rowSelection,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    useEffect(() => {
        if (!searchKey || searchValue === undefined) return;
        const column = table.getColumn(searchKey);
        if (column && column.getFilterValue() !== searchValue) {
            column.setFilterValue(searchValue);
        }
    }, [searchKey, searchValue, table]);

    useEffect(() => {
        if (!onRowSelectionChange) return;
        const selectedRows = table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original);
        onRowSelectionChange(selectedRows);
    }, [onRowSelectionChange, rowSelection, table]);

    const selectedCount = table.getFilteredSelectedRowModel().rows.length;
    const totalRows = table.getFilteredRowModel().rows.length;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    {/* Global Search */}
                    {enableGlobalFilter && (
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-9 pr-9"
                            />
                            {globalFilter && (
                                <button
                                    onClick={() => setGlobalFilter('')}
                                    className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label="Hapus pencarian"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Row selection info */}
                    {enableRowSelection && selectedCount > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {selectedCount} dari {totalRows} baris dipilih
                        </p>
                    )}

                    {/* Custom toolbar content */}
                    {toolbar}
                </div>

                {/* Column Visibility Toggle */}
                {enableColumnVisibility && (
                    <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
                                <SlidersHorizontal className="mr-2 size-4" />
                                Kolom
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Tampilkan kolom</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {typeof column.columnDef.header === 'string'
                                            ? column.columnDef.header
                                            : column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={cn('hover:bg-muted/35', row.getIsSelected() && 'bg-primary/5')}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-48 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/35">
                                            <Inbox className="size-5" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">Tidak ada data</p>
                                        <p className="text-xs">Ubah filter atau tambahkan data baru.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer: Pagination + Page Size (hidden when pagination is server-side) */}
            {!serverSide && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Row count & page size */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {totalRows > 0 ? (
                                <>
                                    {table.getState().pagination.pageIndex *
                                        table.getState().pagination.pageSize +
                                        1}
                                    -
                                    {Math.min(
                                        (table.getState().pagination.pageIndex + 1) *
                                            table.getState().pagination.pageSize,
                                        totalRows
                                    )}{' '}
                                    dari {totalRows}
                                </>
                            ) : (
                                '0 data'
                            )}
                        </p>

                        {/* Page Size Selector */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">Tampilkan</span>
                            <Select
                                value={String(table.getState().pagination.pageSize)}
                                onValueChange={(value) =>
                                    table.setPageSize(Number(value ?? '10'))
                                }
                                items={Object.fromEntries(pageSizeOptions.map(size => [String(size), String(size)]))}
                            >
                                <SelectTrigger className="h-7 w-[60px] sm:h-8 sm:w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map((size) => (
                                        <SelectItem key={size} value={String(size)}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Right: Page navigation */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                            Hal {table.getState().pagination.pageIndex + 1}/{table.getPageCount() || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-7 sm:size-8"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                            aria-label="Halaman pertama"
                        >
                            <ChevronsLeft className="size-3.5 sm:size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-7 sm:size-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            aria-label="Halaman sebelumnya"
                        >
                            <ChevronLeft className="size-3.5 sm:size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-7 sm:size-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            aria-label="Halaman berikutnya"
                        >
                            <ChevronRight className="size-3.5 sm:size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-7 sm:size-8"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                            aria-label="Halaman terakhir"
                        >
                            <ChevronsRight className="size-3.5 sm:size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Sortable column header with direction indicator.
 * Shows current sort direction (asc/desc) or a neutral icon.
 */
export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: {
    column: Column<TData, TValue>;
    title: string;
    className?: string;
}) {
    if (!column.getCanSort()) {
        return <div className={cn('truncate', className)}>{title}</div>;
    }

    const sorted = column.getIsSorted();

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn('-ml-3 h-8 data-[state=open]:bg-accent max-md:-ml-1 max-md:h-auto max-md:px-0 max-md:py-0 max-md:font-medium', className)}
            onClick={() => column.toggleSorting(sorted === 'asc')}
        >
            <span className="truncate">{title}</span>
            {sorted === 'asc' ? (
                <ArrowUp className="ml-1 size-3.5 shrink-0 max-md:size-3" />
            ) : sorted === 'desc' ? (
                <ArrowDown className="ml-1 size-3.5 shrink-0 max-md:size-3" />
            ) : (
                <ArrowUpDown className="ml-1 size-3.5 shrink-0 opacity-50 max-md:hidden" />
            )}
        </Button>
    );
}

/**
 * Selection column definition helper.
 * Add this as the first column to enable row checkboxes.
 *
 * Usage:
 * const columns = [getSelectionColumn<MyType>(), ...otherColumns]
 */
export function getSelectionColumn<TData>(): ColumnDef<TData, unknown> {
    return {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Pilih semua baris"
                className="translate-y-[2px]"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Pilih baris"
                className="translate-y-[2px]"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    };
}
