import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface WorkReport {
    id: number;
    client_id: number | null;
    category_id: number | null;
    description: string | null;
    status: string;
    created_at: string;
    client?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
}

interface BapData {
    id: number;
    nomor_surat: string;
    client_id: number;
    tanggal: string;
    status: string;
    work_report_ids: number[];
}

interface Props {
    bap: BapData;
    clients: { id: number; name: string }[];
    workReports: WorkReport[];
}

export default function Edit({ bap, clients, workReports }: Props) {
    const [clientFilter, setClientFilter] = useState(String(bap.client_id));

    const { data, setData, put, processing, errors } = useForm({
        client_id: String(bap.client_id),
        tanggal: bap.tanggal.split('T')[0],
        work_report_ids: bap.work_report_ids ?? [],
    });

    // Filter work reports by selected client
    const filteredWorkReports = clientFilter
        ? workReports.filter((wr) => String(wr.client_id) === clientFilter)
        : workReports;

    const handleClientFilterChange = (value: string) => {
        const v = value === 'all' ? '' : value;
        setClientFilter(v);
        setData((prev) => ({
            ...prev,
            client_id: v,
            work_report_ids: [],
        }));
    };

    const handleWorkReportToggle = (reportId: number, checked: boolean) => {
        if (checked) {
            setData('work_report_ids', [...data.work_report_ids, reportId]);
        } else {
            setData(
                'work_report_ids',
                data.work_report_ids.filter((id) => id !== reportId)
            );
        }
    };

    const handleSelectAll = () => {
        const allIds = filteredWorkReports.map((wr) => wr.id);
        setData('work_report_ids', allIds);
    };

    const handleDeselectAll = () => {
        setData('work_report_ids', []);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/baps/${bap.id}`, {
            onSuccess: () => {
                toast.success('BAP berhasil diperbarui.');
            },
            onError: () => {
                toast.error('Gagal memperbarui BAP. Periksa form dan coba lagi.');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={`/baps/${bap.id}`}>
                        <Button variant="ghost" size="icon-sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit BAP
                    </h2>
                </div>
            }
        >
            <Head title="Edit BAP" />

            <div className="mx-auto max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tanggal BAP */}
                    <div className="space-y-2">
                        <Label htmlFor="tanggal">
                            Tanggal BAP <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="tanggal"
                            type="date"
                            value={data.tanggal}
                            onChange={(e) => setData('tanggal', e.target.value)}
                            aria-invalid={!!errors.tanggal}
                        />
                        {errors.tanggal && (
                            <p className="text-sm text-destructive">{errors.tanggal}</p>
                        )}
                    </div>

                    {/* Filter Klien */}
                    <div className="space-y-2">
                        <Label>
                            Klien <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={clientFilter || 'all'}
                            onValueChange={(value) => handleClientFilterChange(value ?? 'all')}
                            items={{ all: 'Semua Klien', ...Object.fromEntries(clients.map(c => [String(c.id), c.name])) }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih klien untuk filter laporan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Klien</SelectItem>
                                {clients.map((client) => (
                                    <SelectItem
                                        key={client.id}
                                        value={String(client.id)}
                                    >
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.client_id && (
                            <p className="text-sm text-destructive">{errors.client_id}</p>
                        )}
                    </div>

                    <Separator />

                    {/* Pilih Laporan Kerja */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>
                                Pilih Laporan Kerja (Submitted){' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    disabled={filteredWorkReports.length === 0}
                                >
                                    Pilih Semua
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeselectAll}
                                    disabled={data.work_report_ids.length === 0}
                                >
                                    Hapus Pilihan
                                </Button>
                            </div>
                        </div>

                        {errors.work_report_ids && (
                            <p className="text-sm text-destructive">{errors.work_report_ids}</p>
                        )}

                        {filteredWorkReports.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        {clientFilter
                                            ? 'Tidak ada laporan kerja submitted untuk klien ini.'
                                            : 'Tidak ada laporan kerja submitted yang tersedia. Pilih klien terlebih dahulu.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {filteredWorkReports.map((report) => (
                                    <Card
                                        key={report.id}
                                        className={`cursor-pointer transition-colors ${
                                            data.work_report_ids.includes(report.id)
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() =>
                                            handleWorkReportToggle(
                                                report.id,
                                                !data.work_report_ids.includes(report.id)
                                            )
                                        }
                                    >
                                        <CardContent className="flex items-start gap-4 py-4">
                                            <Checkbox
                                                checked={data.work_report_ids.includes(report.id)}
                                                onCheckedChange={(checked) =>
                                                    handleWorkReportToggle(report.id, !!checked)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium">
                                                        {report.client?.name ?? '-'}
                                                    </p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(report.created_at).toLocaleDateString('id-ID', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Kategori: {report.category?.name ?? '-'}
                                                </p>
                                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                                    {report.description || 'Tidak ada deskripsi'}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {data.work_report_ids.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {data.work_report_ids.length} laporan dipilih
                            </p>
                        )}
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                        <Link href={`/baps/${bap.id}`}>
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
