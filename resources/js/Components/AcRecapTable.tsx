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
    suhu_before_r: number;
    suhu_before_s: number;
    suhu_before_t: number;
    suhu_after_r: number;
    suhu_after_s: number;
    suhu_after_t: number;
    ampere_before_r: number;
    ampere_before_s: number;
    ampere_before_t: number;
    ampere_after_r: number;
    ampere_after_s: number;
    ampere_after_t: number;
    freon_before: number;
    freon_after: number;
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
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", stickyColumnClass, mobileClass)}>
                                NO
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", mobileClass)}>
                                TANGGAL
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", mobileClass)}>
                                LOKASI
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", mobileClass)}>
                                TYPE AC
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", mobileClass)}>
                                MEREK
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", mobileClass)}>
                                KAPASITAS
                            </TableHead>
                            <TableHead colSpan={3} className={cn("text-center border-r", mobileClass)}>
                                SUHU BEFORE
                            </TableHead>
                            <TableHead colSpan={3} className={cn("text-center border-r", mobileClass)}>
                                SUHU AFTER
                            </TableHead>
                            <TableHead colSpan={3} className={cn("text-center border-r", mobileClass)}>
                                AMPERE BEFORE
                            </TableHead>
                            <TableHead colSpan={3} className={cn("text-center border-r", mobileClass)}>
                                AMPERE AFTER
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", mobileClass)}>
                                TEKANAN FREON BEFORE
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center border-r align-middle", mobileClass)}>
                                TEKANAN FREON AFTER
                            </TableHead>
                            <TableHead rowSpan={2} className={cn("text-center align-middle", mobileClass)}>
                                KETERANGAN
                            </TableHead>
                        </TableRow>
                        {/* Second header row: R/S/T sub-columns */}
                        <TableRow>
                            <TableHead className={cn("text-center border-r", mobileClass)}>R</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>S</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>T</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>R</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>S</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>T</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>R</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>S</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>T</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>R</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>S</TableHead>
                            <TableHead className={cn("text-center border-r", mobileClass)}>T</TableHead>
                        </TableRow>
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
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.suhu_before_r}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.suhu_before_s}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.suhu_before_t}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.suhu_after_r}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.suhu_after_s}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.suhu_after_t}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.ampere_before_r}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.ampere_before_s}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.ampere_before_t}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.ampere_after_r}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.ampere_after_s}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.ampere_after_t}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.freon_before}</TableCell>
                                <TableCell className={cn("text-center border-r", mobileClass)}>{row.freon_after}</TableCell>
                                <TableCell className={cn(mobileClass)}>{row.keterangan ?? '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
