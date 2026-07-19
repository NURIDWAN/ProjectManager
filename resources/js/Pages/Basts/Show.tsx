import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PdfPreviewModal } from '@/Components/PdfPreviewModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Download,
    Eye,
    Trash2,
    FileText,
    Calendar,
    Building2,
    User,
    Hash,
    MapPin,
    Phone,
    ClipboardList,
} from 'lucide-react';
import { Bast, WorkItem } from '@/types';

interface WorkReport {
    id: number;
    client_id: number | null;
    category_id: number | null;
    technician_id: number;
    description: string | null;
    area: string | null;
    status: 'draft' | 'submitted';
    submitted_at: string | null;
    created_at: string;
    category?: { id: number; name: string } | null;
    technician?: { id: number; name: string } | null;
    client?: { id: number; name: string } | null;
    before_photo_items?: { id: number; photo_path: string; caption: string | null; photo_url: string; sort_order: number }[];
    after_photo_items?: { id: number; photo_path: string; caption: string | null; photo_url: string; sort_order: number }[];
}

interface Props {
    bast: Bast;
    workReports: WorkReport[];
    workItems: WorkItem[];
}

export default function Show({ bast, workReports, workItems }: Props) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const handleExportPdf = () => {
        window.location.assign(`/basts/${bast.id}/export-pdf`);
    };

    const handleDelete = () => {
        router.delete(`/basts/${bast.id}`, {
            onSuccess: () => {
                toast.success('BAST berhasil dihapus.');
            },
            onError: () => {
                toast.error('Gagal menghapus BAST.');
            },
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateStr: string) => {
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
                        <Link href="/basts">
                            <Button variant="ghost" size="icon-sm">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Detail BAST
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {bast.document_number}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPdfPreviewOpen(true)}
                        >
                            <Eye className="mr-2 size-4" />
                            Review
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPdf}
                        >
                            <Download className="mr-2 size-4" />
                            Download PDF
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteModalOpen(true)}
                        >
                            <Trash2 className="mr-2 size-4" />
                            Hapus
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`BAST - ${bast.document_number}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Main Content: 2 column layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - BAST Info & Work Items */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Informasi BAST */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="size-4 text-muted-foreground" />
                                    Informasi BAST
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <Hash className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Nomor Dokumen
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {bast.document_number}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Calendar className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Tanggal
                                            </p>
                                            <p className="text-sm">
                                                {formatDate(bast.tanggal)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Building2 className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Klien
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {bast.client?.name ?? '-'}
                                            </p>
                                        </div>
                                    </div>
                                    {bast.bap && (
                                        <div className="flex items-start gap-3">
                                            <ClipboardList className="mt-0.5 size-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Nomor BAP
                                                </p>
                                                <p className="text-sm">
                                                    {bast.bap.nomor_surat}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Work Items Table */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ClipboardList className="size-4 text-muted-foreground" />
                                    Uraian Pekerjaan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {workItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <ClipboardList className="mb-2 size-10 text-muted-foreground/40" />
                                        <p className="text-sm text-muted-foreground">
                                            Tidak ada uraian pekerjaan.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/30">
                                                    <th className="w-12 px-3 py-2 text-center font-medium">
                                                        No
                                                    </th>
                                                    <th className="px-3 py-2 text-left font-medium">
                                                        Uraian Pekerjaan
                                                    </th>
                                                    <th className="w-24 px-3 py-2 text-center font-medium">
                                                        Satuan
                                                    </th>
                                                    <th className="w-20 px-3 py-2 text-center font-medium">
                                                        Jumlah
                                                    </th>
                                                    <th className="w-32 px-3 py-2 text-left font-medium">
                                                        Keterangan
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {workItems.map((item) => (
                                                    <tr
                                                        key={item.no}
                                                        className="border-b last:border-b-0"
                                                    >
                                                        <td className="px-3 py-2 text-center">
                                                            {item.no}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {item.uraian_pekerjaan}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {item.satuan}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            {item.jumlah}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {item.keterangan || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Client Info & Document */}
                    <div className="space-y-6">
                        {/* Info Klien */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Building2 className="size-4 text-muted-foreground" />
                                    Info Klien
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Nama Klien
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {bast.client?.name ?? '-'}
                                    </p>
                                </div>

                                {bast.client?.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Alamat
                                            </p>
                                            <p className="text-sm">
                                                {bast.client.address}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {bast.client?.pic_name && (
                                    <div className="flex items-start gap-2">
                                        <User className="mt-0.5 size-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                PIC
                                            </p>
                                            <p className="text-sm">
                                                {bast.client.pic_name}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {bast.client?.pic_phone && (
                                    <div className="flex items-start gap-2">
                                        <Phone className="mt-0.5 size-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Telepon PIC
                                            </p>
                                            <p className="text-sm">
                                                {bast.client.pic_phone}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Dokumen */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Download className="size-4 text-muted-foreground" />
                                    Dokumen
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    onClick={handleExportPdf}
                                    className="group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-red-50">
                                        <FileText className="size-5 text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium group-hover:text-primary">
                                            BAST_{bast.document_number.replace(/\//g, '-')}.pdf
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Klik untuk download
                                        </p>
                                    </div>
                                    <Download className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline / Meta */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="size-4 text-muted-foreground" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative space-y-4 pl-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
                                    <div className="relative">
                                        <div className="absolute -left-4 top-1.5 size-2 rounded-full bg-primary" />
                                        <div>
                                            <p className="text-xs font-medium">Dibuat</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(bast.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    {bast.updated_at !== bast.created_at && (
                                        <div className="relative">
                                            <div className="absolute -left-4 top-1.5 size-2 rounded-full bg-muted-foreground/40" />
                                            <div>
                                                <p className="text-xs font-medium">
                                                    Terakhir diperbarui
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(bast.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus BAST</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus BAST{' '}
                            <span className="font-semibold">
                                {bast.document_number}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                open={pdfPreviewOpen}
                onOpenChange={setPdfPreviewOpen}
                url={`/basts/${bast.id}/pdf-preview`}
                title={`BAST - ${bast.document_number}`}
            />
        </AuthenticatedLayout>
    );
}
