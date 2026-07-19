import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
    if (rows.length === 0) {
        return null;
    }

    const displayTitle = title ?? 'REKAP DATA PEKERJAAN MAINTENANCE AC';

    return (
        <div className="space-y-4">
            <div className="text-center">
                <h3 className="text-lg font-bold uppercase">{displayTitle}</h3>
                {clientName && (
                    <p className="text-sm text-muted-foreground">{clientName}</p>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {/* First header row: grouped columns */}
                        <TableRow>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                NO
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                TANGGAL
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                LOKASI
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                TYPE AC
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                MEREK
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                KAPASITAS
                            </TableHead>
                            <TableHead colSpan={3} className="text-center border-r">
                                SUHU BEFORE
                            </TableHead>
                            <TableHead colSpan={3} className="text-center border-r">
                                SUHU AFTER
                            </TableHead>
                            <TableHead colSpan={3} className="text-center border-r">
                                AMPERE BEFORE
                            </TableHead>
                            <TableHead colSpan={3} className="text-center border-r">
                                AMPERE AFTER
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                TEKANAN FREON BEFORE
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center border-r align-middle">
                                TEKANAN FREON AFTER
                            </TableHead>
                            <TableHead rowSpan={2} className="text-center align-middle">
                                KETERANGAN
                            </TableHead>
                        </TableRow>
                        {/* Second header row: R/S/T sub-columns */}
                        <TableRow>
                            <TableHead className="text-center border-r">R</TableHead>
                            <TableHead className="text-center border-r">S</TableHead>
                            <TableHead className="text-center border-r">T</TableHead>
                            <TableHead className="text-center border-r">R</TableHead>
                            <TableHead className="text-center border-r">S</TableHead>
                            <TableHead className="text-center border-r">T</TableHead>
                            <TableHead className="text-center border-r">R</TableHead>
                            <TableHead className="text-center border-r">S</TableHead>
                            <TableHead className="text-center border-r">T</TableHead>
                            <TableHead className="text-center border-r">R</TableHead>
                            <TableHead className="text-center border-r">S</TableHead>
                            <TableHead className="text-center border-r">T</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.no}>
                                <TableCell className="text-center border-r">{row.no}</TableCell>
                                <TableCell className="text-center border-r">{row.tanggal}</TableCell>
                                <TableCell className="border-r">{row.lokasi}</TableCell>
                                <TableCell className="text-center border-r">{row.tipe_ac}</TableCell>
                                <TableCell className="text-center border-r">{row.merek}</TableCell>
                                <TableCell className="text-center border-r">{row.kapasitas}</TableCell>
                                <TableCell className="text-center border-r">{row.suhu_before_r}</TableCell>
                                <TableCell className="text-center border-r">{row.suhu_before_s}</TableCell>
                                <TableCell className="text-center border-r">{row.suhu_before_t}</TableCell>
                                <TableCell className="text-center border-r">{row.suhu_after_r}</TableCell>
                                <TableCell className="text-center border-r">{row.suhu_after_s}</TableCell>
                                <TableCell className="text-center border-r">{row.suhu_after_t}</TableCell>
                                <TableCell className="text-center border-r">{row.ampere_before_r}</TableCell>
                                <TableCell className="text-center border-r">{row.ampere_before_s}</TableCell>
                                <TableCell className="text-center border-r">{row.ampere_before_t}</TableCell>
                                <TableCell className="text-center border-r">{row.ampere_after_r}</TableCell>
                                <TableCell className="text-center border-r">{row.ampere_after_s}</TableCell>
                                <TableCell className="text-center border-r">{row.ampere_after_t}</TableCell>
                                <TableCell className="text-center border-r">{row.freon_before}</TableCell>
                                <TableCell className="text-center border-r">{row.freon_after}</TableCell>
                                <TableCell>{row.keterangan ?? '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
