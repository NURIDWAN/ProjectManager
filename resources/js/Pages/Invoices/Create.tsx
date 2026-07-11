import { useState, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Bap {
    id: number;
    nomor_surat: string;
    client_id: number;
    tanggal: string;
    status: string;
    client?: { id: number; name: string } | null;
}

interface ServiceOption {
    id: number;
    code: string;
    name: string;
    unit: string;
    price: string | number;
    type: string;
    is_active: boolean;
}

interface SuggestedItem {
    service_id: number;
    service_name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
}

interface InvoiceItem {
    service_id: number;
    service_name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
}

interface Props {
    baps: Bap[];
    suggestedItems: SuggestedItem[];
    services: ServiceOption[];
    selectedBapId: string;
}

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function Create({ baps, suggestedItems, services, selectedBapId }: Props) {
    const [selectedBap, setSelectedBap] = useState(selectedBapId || '');
    const [items, setItems] = useState<InvoiceItem[]>(
        suggestedItems.length > 0
            ? suggestedItems.map((item) => ({
                  service_id: item.service_id,
                  service_name: item.service_name,
                  unit: item.unit,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  discount_percent: item.discount_percent,
              }))
            : []
    );

    const { post, processing, errors } = useForm<{
        bap_id?: string;
        items?: string;
    }>({});

    // Real-time calculation
    const calculations = useMemo(() => {
        const lineTotals = items.map((item) => {
            return item.quantity * item.unit_price * (1 - item.discount_percent / 100);
        });

        const subtotal = lineTotals.reduce((sum, lt) => sum + lt, 0);
        const ppn = subtotal * 0.11;
        const grandTotal = subtotal + ppn;

        return { lineTotals, subtotal, ppn, grandTotal };
    }, [items]);

    const handleBapChange = (value: string) => {
        const v = value === 'none' ? '' : value;
        setSelectedBap(v);

        if (v) {
            // Navigate to reload page with bap_id to get suggested items
            router.get('/invoices/create', { bap_id: v }, {
                preserveState: false,
                replace: true,
            });
        } else {
            setItems([]);
        }
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: typeof value === 'string' ? parseFloat(value) || 0 : value,
            };
            return updated;
        });
    };

    const handleAddItem = () => {
        if (services.length === 0) return;
        const firstService = services[0];
        setItems((prev) => [
            ...prev,
            {
                service_id: firstService.id,
                service_name: firstService.name,
                unit: firstService.unit,
                quantity: 1,
                unit_price: parseFloat(String(firstService.price)),
                discount_percent: 0,
            },
        ]);
    };

    const handleServiceChange = (index: number, serviceId: string) => {
        const service = services.find((s) => s.id === parseInt(serviceId));
        if (!service) return;

        setItems((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                service_id: service.id,
                service_name: service.name,
                unit: service.unit,
                unit_price: parseFloat(String(service.price)),
            };
            return updated;
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedBap) {
            toast.error('Pilih BAP terlebih dahulu.');
            return;
        }

        if (items.length === 0) {
            toast.error('Tambahkan minimal satu item invoice.');
            return;
        }

        const formData = {
            bap_id: parseInt(selectedBap),
            items: items.map((item) => ({
                service_id: item.service_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent,
            })),
        };

        router.post('/invoices', formData, {
            onSuccess: () => {
                toast.success('Invoice berhasil dibuat.');
            },
            onError: (errs) => {
                const errorMsg = Object.values(errs).flat().join(', ');
                toast.error(errorMsg || 'Gagal membuat invoice. Periksa form dan coba lagi.');
            },
        });
    };

    const selectedBapData = baps.find((b) => String(b.id) === selectedBap);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/invoices">
                        <Button variant="ghost" size="icon-sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Buat Invoice Baru
                    </h2>
                </div>
            }
        >
            <Head title="Buat Invoice" />

            <div className="mx-auto max-w-5xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* BAP Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pilih BAP</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>
                                    BAP (Approved) <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selectedBap || 'none'}
                                    onValueChange={(value) => handleBapChange(value ?? 'none')}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih BAP yang telah di-approve" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Pilih BAP --</SelectItem>
                                        {baps.map((bap) => (
                                            <SelectItem key={bap.id} value={String(bap.id)}>
                                                {bap.nomor_surat} — {bap.client?.name ?? 'Unknown'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.bap_id && (
                                    <p className="text-sm text-destructive">{errors.bap_id}</p>
                                )}
                            </div>

                            {selectedBapData && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Nomor BAP</p>
                                            <p className="text-sm font-medium">{selectedBapData.nomor_surat}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Klien</p>
                                            <p className="text-sm font-medium">{selectedBapData.client?.name ?? '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tanggal</p>
                                            <p className="text-sm font-medium">
                                                {new Date(selectedBapData.tanggal).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Invoice Items */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Item Invoice</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddItem}
                                    disabled={services.length === 0}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Tambah Item
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {items.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        {selectedBap
                                            ? 'Tidak ada item. Klik "Tambah Item" untuk menambahkan.'
                                            : 'Pilih BAP terlebih dahulu untuk auto-populate items.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[200px]">Jasa/Produk</TableHead>
                                                <TableHead className="w-[80px]">Satuan</TableHead>
                                                <TableHead className="w-[100px]">Qty</TableHead>
                                                <TableHead className="w-[150px]">Harga Satuan</TableHead>
                                                <TableHead className="w-[100px]">Diskon (%)</TableHead>
                                                <TableHead className="w-[150px] text-right">Total</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Select
                                                            value={String(item.service_id)}
                                                            onValueChange={(value) => handleServiceChange(index, value ?? '')}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {services.map((service) => (
                                                                    <SelectItem
                                                                        key={service.id}
                                                                        value={String(service.id)}
                                                                    >
                                                                        {service.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {item.unit}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0.01"
                                                            step="0.01"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'quantity', e.target.value)
                                                            }
                                                            className="w-full"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={item.unit_price}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'unit_price', e.target.value)
                                                            }
                                                            className="w-full"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={item.discount_percent}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'discount_percent', e.target.value)
                                                            }
                                                            className="w-full"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatRupiah(calculations.lineTotals[index] ?? 0)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() => handleRemoveItem(index)}
                                                            title="Hapus item"
                                                        >
                                                            <Trash2 className="size-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {errors.items && (
                                <p className="mt-2 text-sm text-destructive">{errors.items}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Totals */}
                    {items.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Subtotal</span>
                                        <span className="text-sm font-medium">
                                            {formatRupiah(calculations.subtotal)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">PPN (11%)</span>
                                        <span className="text-sm font-medium">
                                            {formatRupiah(calculations.ppn)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-semibold">Grand Total</span>
                                        <span className="text-base font-bold text-primary">
                                            {formatRupiah(calculations.grandTotal)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing || items.length === 0 || !selectedBap}>
                            {processing ? 'Menyimpan...' : 'Buat Invoice'}
                        </Button>
                        <Link href="/invoices">
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
