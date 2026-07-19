import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge } from '@/Components/StatusBadge';
import AcRecapTable, { AcRecapRow } from '@/Components/AcRecapTable';
import { PdfPreviewModal } from '@/Components/PdfPreviewModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    CheckCircle,
    Download,
    Eye,
    FileText,
    Calendar,
    Building2,
    User,
    ClipboardList,
    Hash,
    MapPin,
    Phone,
} from 'lucide-react';

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
    before_photo_items?: { id: number; photo_path: string; caption: string | null; photo_url: string; sort_order: number }[];
    after_photo_items?: { id: number; photo_path: string; caption: string | null; photo_url: string; sort_order: number }[];
}

interface Bap {
    id: number;
    nomor_surat: string;
    client_id: number;
    tanggal: string;
    status: 'draft' | 'approved';
    work_report_ids: number[];
    signed_by: string | null;
    created_at: string;
    updated_at: string;
    client?: {
        id: number;
        name: string;
        address?: string;
        pic_name?: string;
        pic_phone?: string;
    } | null;
}

interface Props {
    bap: Bap;
    workReports: WorkReport[];
    acRecapRows?: AcRecapRow[];
}

export default function Show({ bap, workReports, acRecapRows }: Props) {
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [signedBy, setSignedBy] = useState('');
    const [signedByError, setSignedByError] = useState('');
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const handleApprove = () => {
        if (!signedBy.trim()) {
            setSignedByError('Nama pihak yang menyetujui wajib diisi.');
            return;
        }
        setSignedByError('');

        router.post(
            `/baps/${bap.id}/approve`,
            { signed_by: signedBy },
            {
                onSuccess: () => {
                    toast.success('BAP berhasil di-approve.');
                    setApproveModalOpen(false);
                    setSignedBy('');
                },
                onError: (errors) => {
                    const errorMsg = Object.values(errors).flat().join(', ');
                    toast.error(errorMsg || 'Gagal approve BAP.');
                    setApproveModalOpen(false);
                },
            }
        );
    };

    const handleExportPdf = () => {
        window.location.assign(`/baps/${bap.id}/export-pdf`);
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
                        <Link href="/baps">
                            <Button variant="ghost" size="icon-sm">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Detail BAP
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {bap.nomor_surat}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {bap.status === 'draft' && (
                            <Button
                                size="sm"
                                onClick={() => setApproveModalOpen(true)}
                            >
                                <CheckCircle className="mr-2 size-4" />
                                Approve
                            </Button>
                        )}
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
                    </div>
                </div>
            }
        >
            <Head title={`BAP - ${bap.nomor_surat}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Status Banner */}
                {bap.status === 'approved' && bap.signed_by && (
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                        <CheckCircle className="size-5 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-green-700">
                                BAP sudah disetujui
                            </p>
                            <p className="text-xs text-green-600">
                                Ditandatangani oleh: {bap.signed_by}
                            </p>
                        </div>
                    </div>
                )}

                {bap.status === 'draft' && (
                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                        <FileText className="size-5 text-amber-600" />
                        <div>
                            <p className="text-sm font-medium text-amber-700">
                                BAP belum di-approve
                            </p>
                            <p className="text-xs text-amber-600">
                                BAP perlu disetujui sebelum dapat digunakan untuk membuat
                                invoice.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Content: 2 column layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - BAP Info */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Informasi BAP */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="size-4 text-muted-foreground" />
                                        Informasi BAP
                                    </CardTitle>
                                    <StatusBadge status={bap.status} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <Hash className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Nomor Surat
                                            </p>
                                            <p className="text-sm font-semibold">
                                                {bap.nomor_surat}
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
                                                {formatDate(bap.tanggal)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <ClipboardList className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Jumlah Laporan Kerja
                                            </p>
                                            <p className="text-sm">
                                                {workReports.length} laporan
                                            </p>
                                        </div>
                                    </div>
                                    {bap.signed_by && (
                                        <div className="flex items-start gap-3">
                                            <User className="mt-0.5 size-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Disetujui oleh
                                                </p>
                                                <p className="text-sm">
                                                    {bap.signed_by}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detail Pekerjaan - Table BAP Format */}
                        {/* AC Recap Table - before visual documentation */}
                        {acRecapRows && acRecapRows.length > 0 && (
                            <Card className="overflow-hidden">
                                <CardContent className="overflow-x-auto p-4">
                                    <AcRecapTable rows={acRecapRows} clientName={bap.client?.name ?? undefined} />
                                </CardContent>
                            </Card>
                        )}

                        {workReports.length === 0 ? (
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ClipboardList className="size-4 text-muted-foreground" />
                                        Detail Pekerjaan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <ClipboardList className="mb-2 size-10 text-muted-foreground/40" />
                                        <p className="text-sm text-muted-foreground">
                                            Tidak ada laporan kerja terkait.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {workReports.map((report, index) => (
                                    <Card key={report.id} className="overflow-hidden">
                                        {/* Header Info Table - like the image */}
                                        <div className="border-b">
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b">
                                                        <td className="w-40 border-r px-3 py-1.5 font-medium text-muted-foreground">
                                                            Tanggal Pekerjaan
                                                        </td>
                                                        <td className="w-4 border-r px-2 py-1.5 text-center text-muted-foreground">:</td>
                                                        <td className="px-3 py-1.5 font-semibold">
                                                            {formatDate(report.created_at)}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="border-r px-3 py-1.5 font-medium text-muted-foreground">
                                                            Jenis Pekerjaan
                                                        </td>
                                                        <td className="border-r px-2 py-1.5 text-center text-muted-foreground">:</td>
                                                        <td className="px-3 py-1.5 font-semibold">
                                                            {report.category?.name ?? '-'}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b">
                                                        <td className="border-r px-3 py-1.5 font-medium text-muted-foreground">
                                                            Konsumen
                                                        </td>
                                                        <td className="border-r px-2 py-1.5 text-center text-muted-foreground">:</td>
                                                        <td className="px-3 py-1.5 font-semibold">
                                                            {bap.client?.name ?? '-'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border-r px-3 py-1.5 font-medium text-muted-foreground">
                                                            Alamat
                                                        </td>
                                                        <td className="border-r px-2 py-1.5 text-center text-muted-foreground">:</td>
                                                        <td className="px-3 py-1.5 font-semibold">
                                                            {bap.client?.address ?? '-'}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Documentation Table */}
                                        {((report.before_photo_items && report.before_photo_items.length > 0) ||
                                          (report.after_photo_items && report.after_photo_items.length > 0)) && (
                                            <div className="border-t">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-muted/30">
                                                            <th className="w-12 border-r px-2 py-2 text-center font-bold">
                                                                NO
                                                            </th>
                                                            <th className="px-3 py-2 text-center font-bold uppercase">
                                                                Visual Unit {report.category?.name ?? ''}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {/* Before Photos Row */}
                                                        {report.before_photo_items && report.before_photo_items.length > 0 && (
                                                            <tr className="border-b">
                                                                <td className="border-r px-2 py-3 text-center align-top font-bold">
                                                                    {index + 1}
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        {report.before_photo_items.map((photo) => (
                                                                            <div key={photo.id} className="text-center">
                                                                                <div className="aspect-[4/3] overflow-hidden rounded border">
                                                                                    <img
                                                                                        src={photo.photo_url}
                                                                                        alt={photo.caption || 'Before'}
                                                                                        className="size-full object-cover"
                                                                                    />
                                                                                </div>
                                                                                <p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                                                                                    {photo.caption || 'BEFORE'}
                                                                                </p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}

                                                        {/* After Photos Section Header */}
                                                        {report.after_photo_items && report.after_photo_items.length > 0 && (
                                                            <>
                                                                <tr className="border-b bg-muted/30">
                                                                    <th className="border-r px-2 py-2 text-center font-bold">
                                                                    </th>
                                                                    <th className="px-3 py-2 text-center font-bold uppercase">
                                                                        Visual Unit {report.category?.name ?? ''} After
                                                                    </th>
                                                                </tr>
                                                                <tr className="border-b">
                                                                    <td className="border-r px-2 py-3 text-center align-top font-bold">
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <div className="grid grid-cols-3 gap-3">
                                                                            {report.after_photo_items.map((photo) => (
                                                                                <div key={photo.id} className="text-center">
                                                                                    <div className="aspect-[4/3] overflow-hidden rounded border">
                                                                                        <img
                                                                                            src={photo.photo_url}
                                                                                            alt={photo.caption || 'After'}
                                                                                            className="size-full object-cover"
                                                                                        />
                                                                                    </div>
                                                                                    <p className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                                                                                        {photo.caption || 'AFTER'}
                                                                                    </p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Description if any */}
                                        {report.description && (
                                            <div className="border-t px-4 py-3">
                                                <p className="text-xs font-medium text-muted-foreground">Keterangan:</p>
                                                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                                                    {report.description}
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
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
                                        {bap.client?.name ?? '-'}
                                    </p>
                                </div>

                                {bap.client?.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Alamat
                                            </p>
                                            <p className="text-sm">
                                                {bap.client.address}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {bap.client?.pic_name && (
                                    <div className="flex items-start gap-2">
                                        <User className="mt-0.5 size-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                PIC
                                            </p>
                                            <p className="text-sm">
                                                {bap.client.pic_name}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {bap.client?.pic_phone && (
                                    <div className="flex items-start gap-2">
                                        <Phone className="mt-0.5 size-3.5 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Telepon PIC
                                            </p>
                                            <p className="text-sm">
                                                {bap.client.pic_phone}
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
                                            BAP_{bap.nomor_surat}.pdf
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
                                                {formatDateTime(bap.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    {bap.updated_at !== bap.created_at && (
                                        <div className="relative">
                                            <div className="absolute -left-4 top-1.5 size-2 rounded-full bg-muted-foreground/40" />
                                            <div>
                                                <p className="text-xs font-medium">
                                                    Terakhir diperbarui
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(bap.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {bap.status === 'approved' && (
                                        <div className="relative">
                                            <div className="absolute -left-4 top-1.5 size-2 rounded-full bg-green-500" />
                                            <div>
                                                <p className="text-xs font-medium text-green-700">
                                                    Approved
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Oleh: {bap.signed_by}
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

            {/* Approve Confirmation Dialog */}
            <AlertDialog
                open={approveModalOpen}
                onOpenChange={(open) => {
                    setApproveModalOpen(open);
                    if (!open) {
                        setSignedBy('');
                        setSignedByError('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve BAP</AlertDialogTitle>
                        <AlertDialogDescription>
                            Setelah di-approve, BAP tidak dapat diubah lagi. Masukkan
                            nama pihak yang menyetujui.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="signed_by">
                            Nama Penyetuju{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="signed_by"
                            value={signedBy}
                            onChange={(e) => {
                                setSignedBy(e.target.value);
                                if (signedByError) setSignedByError('');
                            }}
                            placeholder="Masukkan nama pihak yang menyetujui"
                            aria-invalid={!!signedByError}
                        />
                        {signedByError && (
                            <p className="text-sm text-destructive">
                                {signedByError}
                            </p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setApproveModalOpen(false);
                                setSignedBy('');
                                setSignedByError('');
                            }}
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                            Ya, Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                open={pdfPreviewOpen}
                onOpenChange={setPdfPreviewOpen}
                url={`/baps/${bap.id}/pdf-preview`}
                title={`BAP - ${bap.nomor_surat}`}
            />
        </AuthenticatedLayout>
    );
}
