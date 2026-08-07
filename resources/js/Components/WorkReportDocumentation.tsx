import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export interface DocumentPhoto {
    id: number;
    caption: string | null;
    photo_url: string;
}

export interface DocumentWorkReport {
    id: number;
    description: string | null;
    area: string | null;
    submitted_at: string | null;
    created_at: string;
    category?: {
        id: number;
        name: string;
        preset_identifier?: string | null;
    } | null;
    technician?: { id: number; name: string } | null;
    preset_data?: Record<string, unknown>[] | null;
    before_photo_items?: DocumentPhoto[];
    after_photo_items?: DocumentPhoto[];
}

interface Props {
    reports: DocumentWorkReport[];
    clientName?: string;
    clientAddress?: string;
    onlyAc?: boolean;
}

const parseAcCaption = (caption: string | null) => {
    const match = caption?.match(/^ac_unit_(\d+)(?::(.*))?$/);
    return match ? { unitIndex: Number(match[1]), caption: match[2] || null } : null;
};

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

function PhotoGrid({ photos, fallback }: { photos: DocumentPhoto[]; fallback: string }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
                <div key={photo.id} className="text-center">
                    <div className="aspect-[4/3] overflow-hidden rounded border">
                        <img
                            src={photo.photo_url}
                            alt={photo.caption || fallback}
                            className="size-full object-cover"
                        />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                        {photo.caption || fallback}
                    </p>
                </div>
            ))}
        </div>
    );
}

function ReportInformation({
    report,
    clientName,
    clientAddress,
    area,
}: {
    report: DocumentWorkReport;
    clientName?: string;
    clientAddress?: string;
    area?: string;
}) {
    const rows = [
        ['Tanggal Pekerjaan', formatDate(report.submitted_at || report.created_at)],
        ['Jenis Pekerjaan', report.category?.name || '-'],
        ['Area/Lokasi', area || report.area || '-'],
        ['Teknisi', report.technician?.name || '-'],
        ['Konsumen', clientName || '-'],
        ['Alamat', clientAddress || '-'],
    ];

    return (
        <table className="w-full text-sm">
            <tbody>
                {rows.map(([label, value], index) => (
                    <tr key={label} className={index < rows.length - 1 ? 'border-b' : ''}>
                        <td className="w-40 border-r px-3 py-1.5 font-medium text-muted-foreground">
                            {label}
                        </td>
                        <td className="w-4 border-r px-2 py-1.5 text-center text-muted-foreground">:</td>
                        <td className="px-3 py-1.5 font-semibold">{value}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function WorkReportDocumentation({
    reports,
    clientName,
    clientAddress,
    onlyAc = false,
}: Props) {
    const visibleReports = onlyAc
        ? reports.filter((report) => report.category?.preset_identifier === 'ac_maintenance')
        : reports;

    if (visibleReports.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {visibleReports.map((report) => {
                const isAc = report.category?.preset_identifier === 'ac_maintenance';

                if (isAc) {
                    const entries = Array.isArray(report.preset_data) ? report.preset_data : [];
                    const beforePhotos = report.before_photo_items ?? [];
                    const afterPhotos = report.after_photo_items ?? [];

                    return entries.map((entry, unitIndex) => {
                        const unitBefore = beforePhotos.flatMap((photo) => {
                            const parsed = parseAcCaption(photo.caption);
                            return parsed?.unitIndex === unitIndex
                                ? [{ ...photo, caption: parsed.caption }]
                                : [];
                        });
                        const unitAfter = afterPhotos.flatMap((photo) => {
                            const parsed = parseAcCaption(photo.caption);
                            return parsed?.unitIndex === unitIndex
                                ? [{ ...photo, caption: parsed.caption }]
                                : [];
                        });

                        if (unitBefore.length === 0 && unitAfter.length === 0) {
                            return null;
                        }

                        const type = String(entry.tipe_ac || 'AC').toUpperCase();
                        const brand = String(entry.merek || '').trim();
                        const capacity = entry.kapasitas !== null && entry.kapasitas !== undefined && entry.kapasitas !== ''
                            ? `${entry.kapasitas} PK`
                            : '';
                        const identity = [brand, capacity].filter(Boolean).join(' ');
                        const location = String(entry.lokasi || report.area || '-');

                        return (
                            <Card key={`${report.id}-${unitIndex}`} className="overflow-hidden">
                                <CardHeader className="border-b py-3">
                                    <CardTitle className="text-base">
                                        Dokumentasi Unit AC #{unitIndex + 1}
                                        {identity ? ` — ${identity}` : ''}
                                    </CardTitle>
                                </CardHeader>
                                <ReportInformation
                                    report={report}
                                    clientName={clientName}
                                    clientAddress={clientAddress}
                                    area={location}
                                />
                                <CardContent className="space-y-5 border-t p-4">
                                    {unitBefore.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-center text-xs font-bold uppercase">
                                                Visual Unit AC {type} Before
                                            </p>
                                            <PhotoGrid photos={unitBefore} fallback="BEFORE" />
                                        </div>
                                    )}
                                    {unitAfter.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-center text-xs font-bold uppercase">
                                                Visual Unit AC {type} After
                                            </p>
                                            <PhotoGrid photos={unitAfter} fallback="AFTER" />
                                        </div>
                                    )}
                                </CardContent>
                                {report.description && (
                                    <div className="border-t px-4 py-3">
                                        <p className="text-xs font-medium text-muted-foreground">Keterangan:</p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm">{report.description}</p>
                                    </div>
                                )}
                            </Card>
                        );
                    });
                }

                const beforePhotos = report.before_photo_items ?? [];
                const afterPhotos = report.after_photo_items ?? [];

                return (
                    <Card key={report.id} className="overflow-hidden">
                        <ReportInformation
                            report={report}
                            clientName={clientName}
                            clientAddress={clientAddress}
                        />
                        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                            <CardContent className="space-y-5 border-t p-4">
                                {beforePhotos.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-center text-xs font-bold uppercase">
                                            Visual {report.category?.name || 'Pekerjaan'} Before
                                        </p>
                                        <PhotoGrid photos={beforePhotos} fallback="BEFORE" />
                                    </div>
                                )}
                                {afterPhotos.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-center text-xs font-bold uppercase">
                                            Visual {report.category?.name || 'Pekerjaan'} After
                                        </p>
                                        <PhotoGrid photos={afterPhotos} fallback="AFTER" />
                                    </div>
                                )}
                            </CardContent>
                        )}
                        {report.description && (
                            <div className="border-t px-4 py-3">
                                <p className="text-xs font-medium text-muted-foreground">Keterangan:</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm">{report.description}</p>
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
