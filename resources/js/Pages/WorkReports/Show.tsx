import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge } from '@/Components/StatusBadge';
import { ConfirmModal } from '@/Components/ConfirmModal';
import AcRecapTable, { AcRecapRow } from '@/Components/AcRecapTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface WorkReport {
    id: number;
    client_id: number | null;
    category_id: number | null;
    technician_id: number;
    description: string | null;
    status: 'draft' | 'submitted';
    submitted_at: string | null;
    before_photos: string[] | null;
    after_photos: string[] | null;
    preset_data: Record<string, any>[] | null;
    ac_unit_photos?: { before: { id: number; photo_url: string; caption?: string | null }[]; after: { id: number; photo_url: string; caption?: string | null }[] }[];
    created_at: string;
    updated_at: string;
    client?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    technician?: { id: number; name: string } | null;
    before_photos_rel?: { id: number; photo_path: string; caption: string | null; photo_url: string; sort_order: number }[];
    after_photos_rel?: { id: number; photo_path: string; caption: string | null; photo_url: string; sort_order: number }[];
}

interface Props {
    workReport: WorkReport;
}

export default function Show({ workReport }: Props) {
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    // Build AC recap rows from preset_data if available
    const acRecapRows: AcRecapRow[] = (() => {
        if (!workReport.preset_data || !Array.isArray(workReport.preset_data) || workReport.preset_data.length === 0) {
            return [];
        }

        // Format the report date as DD/MM/YYYY
        const reportDate = new Date(workReport.created_at);
        const tanggal = `${String(reportDate.getDate()).padStart(2, '0')}/${String(reportDate.getMonth() + 1).padStart(2, '0')}/${reportDate.getFullYear()}`;

        return workReport.preset_data.map((entry, index) => ({
            no: index + 1,
            tanggal,
            lokasi: entry.lokasi ?? '',
            tipe_ac: entry.tipe_ac ?? '',
            merek: entry.merek ?? '',
            kapasitas: entry.kapasitas ?? 0,
            suhu_before_r: entry.suhu_before_r ?? 0,
            suhu_before_s: entry.suhu_before_s ?? 0,
            suhu_before_t: entry.suhu_before_t ?? 0,
            suhu_after_r: entry.suhu_after_r ?? 0,
            suhu_after_s: entry.suhu_after_s ?? 0,
            suhu_after_t: entry.suhu_after_t ?? 0,
            ampere_before_r: entry.ampere_before_r ?? 0,
            ampere_before_s: entry.ampere_before_s ?? 0,
            ampere_before_t: entry.ampere_before_t ?? 0,
            ampere_after_r: entry.ampere_after_r ?? 0,
            ampere_after_s: entry.ampere_after_s ?? 0,
            ampere_after_t: entry.ampere_after_t ?? 0,
            freon_before: entry.freon_before ?? 0,
            freon_after: entry.freon_after ?? 0,
            keterangan: entry.keterangan ?? null,
        }));
    })();

    const handleSubmit = () => {
        router.post(`/work-reports/${workReport.id}/submit`, {}, {
            onSuccess: () => {
                toast.success('Laporan kerja berhasil disubmit.');
                setSubmitModalOpen(false);
            },
            onError: (errors) => {
                const errorMsg = Object.values(errors).flat().join(', ');
                toast.error(errorMsg || 'Gagal submit laporan kerja.');
                setSubmitModalOpen(false);
            },
        });
    };

    const handleDelete = () => {
        router.delete(`/work-reports/${workReport.id}`, {
            onSuccess: () => {
                toast.success('Laporan kerja berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus laporan kerja.');
                setDeleteModalOpen(false);
            },
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/work-reports">
                            <Button variant="ghost" size="icon-sm">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Detail Laporan Kerja
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {workReport.status === 'draft' && (
                            <>
                                <Link href={`/work-reports/${workReport.id}/edit`}>
                                    <Button variant="outline" size="sm">
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    size="sm"
                                    onClick={() => setSubmitModalOpen(true)}
                                >
                                    <Send className="mr-2 size-4" />
                                    Submit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteModalOpen(true)}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Hapus
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Detail Laporan Kerja" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Info Umum */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Informasi Umum</CardTitle>
                            <StatusBadge status={workReport.status} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Klien
                                </p>
                                <p className="text-sm">
                                    {workReport.client?.name || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Kategori Pekerjaan
                                </p>
                                <p className="text-sm">
                                    {workReport.category?.name || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Teknisi
                                </p>
                                <p className="text-sm">
                                    {workReport.technician?.name || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Tanggal Dibuat
                                </p>
                                <p className="text-sm">
                                    {formatDate(workReport.created_at)}
                                </p>
                            </div>
                            {workReport.submitted_at && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Tanggal Submit
                                    </p>
                                    <p className="text-sm">
                                        {formatDate(workReport.submitted_at)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                {/* Deskripsi */}
                <Card>
                    <CardHeader>
                        <CardTitle>Deskripsi Aktivitas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm">
                            {workReport.description || 'Belum ada deskripsi.'}
                        </p>
                    </CardContent>
                </Card>

                <Separator />

                {/* AC Measurement Data Table */}
                {acRecapRows.length > 0 && (
                    <>
                        <Card>
                            <CardContent className="pt-6">
                                <AcRecapTable rows={acRecapRows} />
                            </CardContent>
                        </Card>

                        {/* Per-unit AC Photos - Table format */}
                        {workReport.ac_unit_photos && workReport.ac_unit_photos.some(
                            (u) => u.before.length > 0 || u.after.length > 0
                        ) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dokumentasi Visual Unit AC</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="border-r px-3 py-2 text-center font-semibold w-12">NO</th>
                                                    <th className="px-3 py-2 text-center font-semibold">VISUAL UNIT AC</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {workReport.ac_unit_photos.map((unitPhotos, idx) => {
                                                    if (unitPhotos.before.length === 0 && unitPhotos.after.length === 0) return null;
                                                    const entry = workReport.preset_data?.[idx];
                                                    const tipeAc = entry?.tipe_ac || 'AC';
                                                    return (
                                                        <tr key={idx} className="border-b">
                                                            <td className="border-r px-3 py-3 text-center font-semibold align-top">{idx + 1}</td>
                                                            <td className="px-3 py-3">
                                                                {/* Before section */}
                                                                {unitPhotos.before.length > 0 && (
                                                                    <div className="mb-4">
                                                                        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide">
                                                                            VISUAL UNIT AC {tipeAc.toUpperCase()} BEFORE
                                                                        </p>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            {unitPhotos.before.map((p) => (
                                                                                <div key={p.id} className="text-center">
                                                                                    <div className="aspect-[4/3] overflow-hidden rounded border">
                                                                                        <img src={p.photo_url} alt="" className="size-full object-cover" />
                                                                                    </div>
                                                                                    {p.caption && (
                                                                                        <p className="mt-1 text-[10px] font-medium uppercase text-muted-foreground">{p.caption}</p>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {/* After section */}
                                                                {unitPhotos.after.length > 0 && (
                                                                    <div>
                                                                        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide">
                                                                            VISUAL UNIT AC {tipeAc.toUpperCase()} AFTER
                                                                        </p>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            {unitPhotos.after.map((p) => (
                                                                                <div key={p.id} className="text-center">
                                                                                    <div className="aspect-[4/3] overflow-hidden rounded border">
                                                                                        <img src={p.photo_url} alt="" className="size-full object-cover" />
                                                                                    </div>
                                                                                    {p.caption && (
                                                                                        <p className="mt-1 text-[10px] font-medium uppercase text-muted-foreground">{p.caption}</p>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Separator />
                    </>
                )}

                {/* Foto Sebelum & Sesudah - hidden for AC preset since photos are per unit */}
                {acRecapRows.length === 0 && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Foto Sebelum</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* New relational photos with captions */}
                        {workReport.before_photos_rel &&
                        workReport.before_photos_rel.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {workReport.before_photos_rel.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="overflow-hidden rounded-lg border"
                                    >
                                        <div className="aspect-square">
                                            <img
                                                src={photo.photo_url}
                                                alt={photo.caption || 'Foto sebelum'}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                        {photo.caption && (
                                            <div className="border-t bg-muted/50 px-2 py-1.5">
                                                <p className="text-center text-xs font-medium uppercase text-muted-foreground">
                                                    {photo.caption}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : workReport.before_photos &&
                        workReport.before_photos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {workReport.before_photos.map((photo, index) => (
                                    <div
                                        key={index}
                                        className="aspect-square overflow-hidden rounded-lg border"
                                    >
                                        <img
                                            src={`/storage/${photo}`}
                                            alt={`Foto sebelum ${index + 1}`}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Belum ada foto sebelum.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {/* Foto Sesudah */}
                <Card>
                    <CardHeader>
                        <CardTitle>Foto Sesudah</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* New relational photos with captions */}
                        {workReport.after_photos_rel &&
                        workReport.after_photos_rel.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {workReport.after_photos_rel.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="overflow-hidden rounded-lg border"
                                    >
                                        <div className="aspect-square">
                                            <img
                                                src={photo.photo_url}
                                                alt={photo.caption || 'Foto sesudah'}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                        {photo.caption && (
                                            <div className="border-t bg-muted/50 px-2 py-1.5">
                                                <p className="text-center text-xs font-medium uppercase text-muted-foreground">
                                                    {photo.caption}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : workReport.after_photos &&
                        workReport.after_photos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {workReport.after_photos.map((photo, index) => (
                                    <div
                                        key={index}
                                        className="aspect-square overflow-hidden rounded-lg border"
                                    >
                                        <img
                                            src={`/storage/${photo}`}
                                            alt={`Foto sesudah ${index + 1}`}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Belum ada foto sesudah.
                            </p>
                        )}
                    </CardContent>
                </Card>
                </>
                )}
            </div>

            {/* Submit Confirmation Modal */}
            <ConfirmModal
                open={submitModalOpen}
                onOpenChange={setSubmitModalOpen}
                title="Submit Laporan Kerja"
                description="Apakah Anda yakin ingin submit laporan ini? Setelah disubmit, laporan tidak dapat diubah lagi."
                confirmLabel="Ya, Submit"
                cancelLabel="Batal"
                variant="default"
                onConfirm={handleSubmit}
                onCancel={() => setSubmitModalOpen(false)}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Hapus Laporan Kerja"
                description="Apakah Anda yakin ingin menghapus laporan kerja ini? Foto terkait juga akan dihapus."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                variant="destructive"
                onConfirm={handleDelete}
                onCancel={() => setDeleteModalOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
