import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export interface AcRecapRow {
    no: number;
    tanggal: string;
    lokasi: string;
    tipe_ac: string;
    merek: string;
    kapasitas: number;
    suhu_before: number | null;
    suhu_after: number | null;
    ampere_input_count: 1 | 2 | 3;
    ampere_before_r: number | null;
    ampere_before_s: number | null;
    ampere_before_t: number | null;
    ampere_after_r: number | null;
    ampere_after_s: number | null;
    ampere_after_t: number | null;
    freon_before: number | null;
    freon_after: number | null;
    keterangan: string | null;
}

export interface AcRecapTableProps {
    rows: AcRecapRow[];
    title?: string;
    clientName?: string;
}

export default function AcRecapTable({ rows, title, clientName }: AcRecapTableProps) {
    const isMobile = useMediaQuery('(max-width: 767px)');

    if (rows.length === 0) {
        return null;
    }

    const displayTitle = title ?? 'REKAP DATA PEKERJAAN MAINTENANCE AC';

    const stickyColumnClass = 'sticky left-0 z-10 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]';
    const mobileClass = isMobile ? 'text-xs p-1' : '';
    const displayMeasurement = (value: number | null | undefined) =>
        value === null || value === undefined ? '-' : value;
    const phases = ['r', 's', 't'] as const;
    const hasMeasurement = (value: number | null | undefined) =>
        value !== null && value !== undefined;
    const getAmpere = (
        row: AcRecapRow,
        timing: 'before' | 'after',
        phase: typeof phases[number],
    ) => row[`ampere_${timing}_${phase}` as keyof AcRecapRow] as number | null;
    const beforePhases = phases.filter((phase) =>
        rows.some((row) => hasMeasurement(getAmpere(row, 'before', phase)))
    );
    const afterPhases = phases.filter((phase) =>
        rows.some((row) => hasMeasurement(getAmpere(row, 'after', phase)))
    );
    const hasAmpere = beforePhases.length > 0 || afterPhases.length > 0;
    const headerRowSpan = hasAmpere ? 2 : 1;

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h3 className="text-lg font-bold uppercase">{displayTitle}</h3>
                {clientName && (
                    <p className="text-sm text-muted-foreground">{clientName}</p>
                )}
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        {/* First header row: grouped columns */}
                        <TableRow>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", stickyColumnClass, mobileClass)}>
                                NO
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                TANGGAL
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                LOKASI
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                TYPE AC
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                MEREK
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                KAPASITAS
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                SUHU BEFORE
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                SUHU AFTER
                            </TableHead>
                            {beforePhases.length > 0 && (
                                <TableHead colSpan={beforePhases.length} className={cn("text-center border-r", mobileClass)}>
                                    AMPERE BEFORE
                                </TableHead>
                            )}
                            {afterPhases.length > 0 && (
                                <TableHead colSpan={afterPhases.length} className={cn("text-center border-r", mobileClass)}>
                                    AMPERE AFTER
                                </TableHead>
                            )}
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                TEKANAN FREON BEFORE
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center border-r align-middle", mobileClass)}>
                                TEKANAN FREON AFTER
                            </TableHead>
                            <TableHead rowSpan={headerRowSpan} className={cn("text-center align-middle", mobileClass)}>
                                KETERANGAN
                            </TableHead>
                        </TableRow>
                        {hasAmpere && (
                            <TableRow>
                                {beforePhases.map((phase) => (
                                    <TableHead key={`before-${phase}`} className={cn("text-center border-r", mobileClass)}>
                                        {phase.toUpperCase()}
                                    </TableHead>
                                ))}
                                {afterPhases.map((phase) => (
                                    <TableHead key={`after-${phase}`} className={cn("text-center border-r", mobileClass)}>
                                        {phase.toUpperCase()}
                                    </TableHead>
                                ))}
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.no}>
                                <TableCell className={cn("text-center border-r", stickyColumnClass, mobileClass)}>{row.no}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.tanggal}</TableCell>
                                <TableCell className={cn("border-r", mobileClass)}>{row.lokasi}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.tipe_ac}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.merek}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.kapasitas}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{displayMeasurement(row.suhu_before)}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{displayMeasurement(row.suhu_after)}</TableCell>
                                {beforePhases.map((phase) => (
                                    <TableCell key={`before-${phase}`} className={cn("text-center border-r", mobileClass)}>
                                        {displayMeasurement(getAmpere(row, 'before', phase))}
                                    </TableCell>
                                ))}
                                {afterPhases.map((phase) => (
                                    <TableCell key={`after-${phase}`} className={cn("text-center border-r", mobileClass)}>
                                        {displayMeasurement(getAmpere(row, 'after', phase))}
                                    </TableCell>
                                ))}
                                <TableCell className={cn("text-center border-r", mobileClass)}>{displayMeasurement(row.freon_before)}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{displayMeasurement(row.freon_after)}</TableCell>
                                <TableCell className={cn(mobileClass)}>{row.keterangan ?? '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
