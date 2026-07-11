import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { StatusBadge } from '@/Components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    MoreHorizontal,
    CreditCard,
    FileText,
    CheckCircle,
} from 'lucide-react';

interface InvoiceItem {
    id: number;
    service_id: number;
    quantity: string;
    unit_price: string;
    discount_percent: string;
    line_total: string;
    service?: {
        id: number;
        code: string;
        name: string;
        unit: string;
    } | null;
}

interface Invoice {
    id: number;
    invoice_number: string;
    bap_id: number;
    client_id: number;
    subtotal: string;
    discount_total: string;
    ppn: string;
    grand_total: string;
    due_date: string | null;
    status: 'draft' | 'unpaid' | 'overdue' | 'paid';
    paid_at: string | null;
    created_at: string;
    updated_at: string;
    client?: {
        id: number;
        name: string;
        address?: string;
        npwp?: string;
        pic_name?: string;
        pic_phone?: string;
    } | null;
    bap?: {
        id: number;
        nomor_surat: string;
    } | null;
    items?: InvoiceItem[];
}

interface Props {
    invoice: Invoice;
}

const formatRupiah = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

export default function Show({ invoice }: Props) {
    const [markUnpaidDialogOpen, setMarkUnpaidDialogOpen] = useState(false);
    const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [dueDateError, setDueDateError] = useState('');

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }
    if (flash?.error) {
        toast.error(flash.error);
    }

    const handleMarkUnpaid = () => {
        if (!dueDate) {
            setDueDateError('Tanggal jatuh tempo wajib diisi.');
            return;
        }
        setDueDateError('');

        router.post(`/invoices/${invoice.id}/mark-unpaid`, { due_date: dueDate }, {
            onSuccess: () => {
                toast.success('Invoice berhasil diubah ke status "unpaid".');
                setMarkUnpaidDialogOpen(false);
                setDueDate('');
            },
            onError: (errors) => {
                const errorMsg = Object.values(errors).flat().join(', ');
                toast.error(errorMsg || 'Gagal mengubah status invoice.');
                setMarkUnpaidDialogOpen(false);
            },
        });
    };

    const handleMarkPaid = () => {
        router.post(`/invoices/${invoice.id}/mark-paid`, {}, {
            onSuccess: () => {
                toast.success('Invoice berhasil ditandai sebagai "paid".');
                setMarkPaidDialogOpen(false);
            },
            onError: (errors) => {
                const errorMsg = Object.values(errors).flat().join(', ');
                toast.error(errorMsg || 'Gagal menandai invoice sebagai paid.');
                setMarkPaidDialogOpen(false);
            },
        });
    };

    const handleExportPdf = () => {
        window.open(`/invoices/${invoice.id}/export-pdf`, '_blank');
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

    const canMarkUnpaid = invoice.status === 'draft';
    const canMarkPaid = invoice.status === 'unpaid' || invoice.status === 'overdue';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/invoices">
                            <Button variant="ghost" size="icon-sm">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Detail Invoice
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Status Actions Dropdown */}
                        {(canMarkUnpaid || canMarkPaid) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant="outline" size="sm">
                                        <MoreHorizontal className="mr-2 size-4" />
                                        Aksi
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {canMarkUnpaid && (
                                        <DropdownMenuItem
                                            onClick={() => setMarkUnpaidDialogOpen(true)}
                                        >
                                            <FileText className="mr-2 size-4" />
                                            Mark as Unpaid
                                        </DropdownMenuItem>
                                    )}
                                    {canMarkPaid && (
                                        <DropdownMenuItem
                                            onClick={() => setMarkPaidDialogOpen(true)}
                                        >
                                            <CheckCircle className="mr-2 size-4" />
                                            Mark as Paid
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Export PDF Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPdf}
                        >
                            <Download className="mr-2 size-4" />
                            Export PDF
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Invoice - ${invoice.invoice_number}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Invoice Summary Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                            <StatusBadge status={invoice.status} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Klien</p>
                                <p className="text-sm font-semibold">{invoice.client?.name ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">No. BAP</p>
                                <p className="text-sm">
                                    {invoice.bap ? (
                                        <Link
                                            href={`/baps/${invoice.bap.id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {invoice.bap.nomor_surat}
                                        </Link>
                                    ) : (
                                        '-'
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</p>
                                <p className="text-sm">{formatDate(invoice.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Jatuh Tempo</p>
                                <p className="text-sm">
                                    {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                                </p>
                            </div>
                            {invoice.paid_at && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tanggal Bayar</p>
                                    <p className="text-sm">{formatDateTime(invoice.paid_at)}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Grand Total</p>
                                <p className="text-lg font-bold text-primary">
                                    {formatRupiah(invoice.grand_total)}
                                </p>
                            </div>
                        </div>

                        {invoice.client?.address && (
                            <>
                                <Separator />
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Alamat Klien</p>
                                        <p className="text-sm">{invoice.client.address}</p>
                                    </div>
                                    {invoice.client.npwp && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">NPWP</p>
                                            <p className="text-sm">{invoice.client.npwp}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Invoice Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]">#</TableHead>
                                        <TableHead>Jasa/Produk</TableHead>
                                        <TableHead className="w-[80px]">Satuan</TableHead>
                                        <TableHead className="w-[80px] text-right">Qty</TableHead>
                                        <TableHead className="w-[140px] text-right">Harga Satuan</TableHead>
                                        <TableHead className="w-[90px] text-right">Diskon</TableHead>
                                        <TableHead className="w-[150px] text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.service?.name ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.service?.unit ?? '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {parseFloat(item.quantity)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatRupiah(item.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {parseFloat(item.discount_percent)}%
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatRupiah(item.line_total)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Tidak ada item.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Totals Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ringkasan Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Subtotal</span>
                                <span className="text-sm font-medium">
                                    {formatRupiah(invoice.subtotal)}
                                </span>
                            </div>
                            {parseFloat(invoice.discount_total) > 0 && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Diskon</span>
                                        <span className="text-sm font-medium text-destructive">
                                            -{formatRupiah(invoice.discount_total)}
                                        </span>
                                    </div>
                                </>
                            )}
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">PPN (11%)</span>
                                <span className="text-sm font-medium">
                                    {formatRupiah(invoice.ppn)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-base font-semibold">Grand Total</span>
                                <span className="text-lg font-bold text-primary">
                                    {formatRupiah(invoice.grand_total)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Status Info */}
                {invoice.status === 'paid' && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="size-5 text-green-600" />
                            <p className="text-sm font-medium text-green-700">
                                Invoice sudah dibayar
                            </p>
                        </div>
                        {invoice.paid_at && (
                            <p className="mt-1 text-xs text-green-600">
                                Dibayar pada: {formatDateTime(invoice.paid_at)}
                            </p>
                        )}
                    </div>
                )}

                {invoice.status === 'overdue' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-700">
                            Invoice telah melewati jatuh tempo
                        </p>
                        <p className="mt-1 text-xs text-red-600">
                            Jatuh tempo: {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                        </p>
                    </div>
                )}
            </div>

            {/* Mark Unpaid Dialog (requires due_date) */}
            <AlertDialog
                open={markUnpaidDialogOpen}
                onOpenChange={(open) => {
                    setMarkUnpaidDialogOpen(open);
                    if (!open) {
                        setDueDate('');
                        setDueDateError('');
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Unpaid</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ubah status invoice menjadi "unpaid". Anda perlu mengisi tanggal jatuh tempo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="due_date">
                            Tanggal Jatuh Tempo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="due_date"
                            type="date"
                            value={dueDate}
                            onChange={(e) => {
                                setDueDate(e.target.value);
                                if (dueDateError) setDueDateError('');
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            aria-invalid={!!dueDateError}
                        />
                        {dueDateError && (
                            <p className="text-sm text-destructive">{dueDateError}</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setMarkUnpaidDialogOpen(false);
                                setDueDate('');
                                setDueDateError('');
                            }}
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkUnpaid}>
                            Ya, Mark Unpaid
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Mark Paid Confirmation Dialog */}
            <AlertDialog
                open={markPaidDialogOpen}
                onOpenChange={setMarkPaidDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menandai invoice ini sebagai sudah dibayar?
                            Setelah ditandai sebagai paid, invoice tidak dapat diubah lagi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkPaid}>
                            Ya, Mark Paid
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}
