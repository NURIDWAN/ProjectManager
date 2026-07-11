import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge } from '@/Components/StatusBadge';
import { ConfirmModal } from '@/Components/ConfirmModal';
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
    created_at: string;
    updated_at: string;
    client?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    technician?: { id: number; name: string } | null;
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

                {/* Foto Sebelum */}
                <Card>
                    <CardHeader>
                        <CardTitle>Foto Sebelum</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {workReport.before_photos &&
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
                        {workReport.after_photos &&
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
