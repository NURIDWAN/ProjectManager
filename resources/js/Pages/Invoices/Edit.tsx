import { useState, useMemo } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface ClientOption {
    id: number;
    name: string;
    address?: string;
    pic_name?: string;
    npwp?: string;
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

interface InvoiceItem {
    service_id: number;
    service_name: string;
    unit: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
}

interface InvoiceItemFromServer {
    id: number;
    service_id: number;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    line_total: number;
    service: { id: number; name: string; unit: string };
}

interface InvoiceData {
    id: number;
    invoice_number: string;
    client_id: number;
    subtotal: number;
    discount_total: number;
    tax_percent: number;
    ppn: number;
    shipping_cost: number;
    grand_total: number;
    due_date: string | null;
    status: string;
    notes: string | null;
    terms: string | null;
    items: InvoiceItemFromServer[];
}

interface Settings {
    company_name?: string;
    company_address?: string;
    company_address_2?: string;
    company_phone?: string;
    company_logo?: string;
    bank_name?: string;
    bank_account_name?: string;
    bank_account_number?: string;
    [key: string]: string | undefined;
}

interface Props {
    invoice: InvoiceData;
    clients: ClientOption[];
    services: ServiceOption[];
    settings: Settings;
}

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function Edit({ invoice, clients, services, settings }: Props) {
    const [selectedClientId, setSelectedClientId] = useState(String(invoice.client_id));
    const [items, setItems] = useState<InvoiceItem[]>(
        invoice.items.map((item) => ({
            service_id: item.service_id,
            service_name: item.service?.name ?? '',
            unit: item.service?.unit ?? '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
        }))
    );
    const [dueDate, setDueDate] = useState(invoice.due_date ?? '');
    const [notes, setNotes] = useState(invoice.notes ?? '');
    const [terms, setTerms] = useState(invoice.terms ?? '');
    const [processing, setProcessing] = useState(false);
    const [amountPaid, setAmountPaid] = useState(0);

    // Custom totals - show toggles based on existing invoice data
    const [showDiscount, setShowDiscount] = useState(invoice.discount_total > 0);
    const [showTax, setShowTax] = useState(invoice.tax_percent > 0);
    const [showShipping, setShowShipping] = useState(invoice.shipping_cost > 0);
    const [discountTotal, setDiscountTotal] = useState(invoice.discount_total);
    const [taxPercent, setTaxPercent] = useState(invoice.tax_percent);
    const [shippingCost, setShippingCost] = useState(invoice.shipping_cost);

    const { errors } = useForm({});

    const calculations = useMemo(() => {
        const lineTotals = items.map((item) =>
            item.quantity * item.unit_price * (1 - item.discount_percent / 100)
        );
        const subtotal = lineTotals.reduce((sum, lt) => sum + lt, 0);
        const afterDiscount = subtotal - (showDiscount ? discountTotal : 0);
        const ppn = showTax ? afterDiscount * (taxPercent / 100) : 0;
        const grandTotal = afterDiscount + ppn + (showShipping ? shippingCost : 0);
        const balanceDue = grandTotal - amountPaid;
        return { lineTotals, subtotal, ppn, grandTotal, balanceDue };
    }, [items, discountTotal, taxPercent, shippingCost, showTax, showDiscount, showShipping, amountPaid]);

    const selectedClient = clients.find((c) => String(c.id) === selectedClientId);

    const handleAddItem = () => {
        if (services.length === 0) return;
        const svc = services[0];
        setItems((prev) => [...prev, {
            service_id: svc.id, service_name: svc.name, unit: svc.unit,
            quantity: 1, unit_price: parseFloat(String(svc.price)), discount_percent: 0,
        }]);
    };

    const handleServiceChange = (index: number, serviceId: string) => {
        const svc = services.find((s) => s.id === parseInt(serviceId));
        if (!svc) return;
        setItems((prev) => {
            const u = [...prev];
            u[index] = { ...u[index], service_id: svc.id, service_name: svc.name, unit: svc.unit, unit_price: parseFloat(String(svc.price)) };
            return u;
        });
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        setItems((prev) => {
            const u = [...prev];
            u[index] = { ...u[index], [field]: typeof value === 'string' ? parseFloat(value) || 0 : value };
            return u;
        });
    };

    const handleRemoveItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId) { toast.error('Pilih klien terlebih dahulu.'); return; }
        if (items.length === 0) { toast.error('Tambahkan minimal satu item.'); return; }
        setProcessing(true);
        router.put(`/invoices/${invoice.id}`, {
            client_id: parseInt(selectedClientId),
            due_date: dueDate || null,
            notes: notes || null,
            terms: terms || null,
            tax_percent: showTax ? taxPercent : 0,
            discount_total: showDiscount ? discountTotal : 0,
            shipping_cost: showShipping ? shippingCost : 0,
            items: items.map((item) => ({
                service_id: item.service_id, quantity: item.quantity,
                unit_price: item.unit_price, discount_percent: item.discount_percent,
            })),
        }, {
            onSuccess: () => toast.success('Invoice berhasil diperbarui.'),
            onError: (errs) => { toast.error(Object.values(errs).flat().join(', ') || 'Gagal memperbarui invoice.'); setProcessing(false); },
            onFinish: () => setProcessing(false),
        });
    };

    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/invoices">
                            <Button variant="ghost" size="icon-sm"><ArrowLeft className="size-4" /></Button>
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Invoice</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSubmit} disabled={processing || items.length === 0 || !selectedClientId}>
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Edit Invoice" />

            <form onSubmit={handleSubmit}>
                <div className="mx-auto max-w-4xl">
                    {/* Invoice Document Layout */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        {/* Top Section: Logo + FAKTUR title */}
                        <div className="flex items-start justify-between border-b p-6 pb-4">
                            {/* Company Logo & Info */}
                            <div className="flex items-start gap-4">
                                {settings.company_logo ? (
                                    <img src={`/storage/${settings.company_logo}`} alt="Logo" className="h-14 w-auto object-contain" />
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">Logo</div>
                                )}
                                <div>
                                    <p className="text-lg font-bold uppercase">{settings.company_name || 'PERUSAHAAN'}</p>
                                    <p className="text-xs text-gray-500">{settings.company_address || ''}</p>
                                    {settings.company_address_2 && <p className="text-xs text-gray-500">{settings.company_address_2}</p>}
                                    {settings.company_phone && <p className="text-xs text-gray-500">Telp. {settings.company_phone}</p>}
                                </div>
                            </div>
                            {/* FAKTUR Title */}
                            <div className="text-right">
                                <h1 className="text-3xl font-bold text-gray-700">INVOICE</h1>
                                <p className="mt-1 text-xs text-gray-500"># {invoice.invoice_number}</p>
                            </div>
                        </div>

                        {/* Client + Meta Section */}
                        <div className="grid grid-cols-2 gap-6 border-b p-6">
                            {/* Left: Client */}
                            <div className="space-y-3">
                                <div>
                                    <Select value={selectedClientId || 'none'} onValueChange={(v) => setSelectedClientId(v === 'none' || !v ? '' : v)} items={Object.fromEntries([['none', '-- Pilih Klien --'], ...clients.map(c => [String(c.id), c.name])])}>
                                        <SelectTrigger className="w-full border-dashed">
                                            <SelectValue placeholder="Pilih Klien..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Pilih Klien --</SelectItem>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)} label={c.name}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {(errors as any).client_id && <p className="text-xs text-destructive mt-1">{(errors as any).client_id}</p>}
                                </div>
                                {selectedClient && (
                                    <div className="space-y-0.5 text-sm text-gray-600">
                                        <p className="font-semibold text-gray-800">{selectedClient.name}</p>
                                        {selectedClient.address && <p>{selectedClient.address}</p>}
                                        {selectedClient.pic_name && <p>PIC: {selectedClient.pic_name}</p>}
                                        {selectedClient.npwp && <p>NPWP: {selectedClient.npwp}</p>}
                                    </div>
                                )}
                            </div>
                            {/* Right: Date & Due */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                    <span className="text-sm text-gray-500">Tanggal</span>
                                    <span className="text-sm font-medium text-right">{today}</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                    <span className="text-sm text-gray-500">Syarat pembayaran</span>
                                    <span className="text-sm text-right text-gray-400">-</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                                    <span className="text-sm text-gray-500">Tanggal jatuh</span>
                                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                        className="h-8 text-sm text-right border-dashed" />
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="p-6 border-b">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-emerald-600 text-white text-xs">
                                        <th className="px-3 py-2 text-left font-semibold rounded-tl">Barang</th>
                                        <th className="px-3 py-2 text-center font-semibold w-[70px]">Kuantitas</th>
                                        <th className="px-3 py-2 text-right font-semibold w-[120px]">Kecepatan</th>
                                        <th className="px-3 py-2 text-right font-semibold w-[140px] rounded-tr">Jumlah</th>
                                        <th className="w-[36px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-100 group">
                                            <td className="py-2 pr-2">
                                                <Select value={item.service_id ? String(item.service_id) : undefined} onValueChange={(v) => handleServiceChange(index, v ?? '')} items={Object.fromEntries(services.map(s => [String(s.id), s.name]))}>
                                                    <SelectTrigger className="w-full border-0 shadow-none h-8 text-sm bg-transparent hover:bg-gray-50">
                                                        <SelectValue placeholder="Pilih barang" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {services.map((svc) => (
                                                            <SelectItem key={svc.id} value={String(svc.id)} label={svc.name}>{svc.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="py-2 px-1">
                                                <Input type="number" min="0.01" step="1" value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="h-8 text-sm text-center border-0 shadow-none bg-transparent hover:bg-gray-50 w-full" />
                                            </td>
                                            <td className="py-2 px-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-gray-400">Rp</span>
                                                    <Input type="number" min="0" step="1000" value={item.unit_price}
                                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                        className="h-8 text-sm text-right border-0 shadow-none bg-transparent hover:bg-gray-50 w-full" />
                                                </div>
                                            </td>
                                            <td className="py-2 px-2 text-right text-sm font-medium">
                                                {formatRupiah(calculations.lineTotals[index] ?? 0)}
                                            </td>
                                            <td className="py-2">
                                                <button type="button" onClick={() => handleRemoveItem(index)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600">
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <button type="button" onClick={handleAddItem}
                                className="mt-3 flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                <Plus className="size-4" /> Item baris
                            </button>
                        </div>

                        {/* Bottom: Notes + Totals side by side */}
                        <div className="grid grid-cols-2 gap-6 p-6 border-b">
                            {/* Left: Notes & Terms */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Catatan</p>
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Catatan untuk klien..."
                                        className="border-dashed text-sm min-h-[80px] resize-none" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Ketentuan</p>
                                    <Textarea value={terms} onChange={(e) => setTerms(e.target.value)}
                                        placeholder="Syarat & ketentuan..."
                                        className="border-dashed text-sm min-h-[80px] resize-none" />
                                </div>
                            </div>

                            {/* Right: Totals */}
                            <div className="space-y-2">
                                {/* Subtotal */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Subtotal</span>
                                    <span className="text-sm font-medium">{formatRupiah(calculations.subtotal)}</span>
                                </div>

                                {/* Toggle buttons */}
                                <div className="flex flex-wrap gap-3 py-1">
                                    {!showDiscount && (
                                        <button type="button" onClick={() => setShowDiscount(true)}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Diskon</button>
                                    )}
                                    {!showTax && (
                                        <button type="button" onClick={() => { setShowTax(true); setTaxPercent(11); }}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Pajak</button>
                                    )}
                                    {!showShipping && (
                                        <button type="button" onClick={() => setShowShipping(true)}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Pengiriman</button>
                                    )}
                                </div>

                                {/* Discount */}
                                {showDiscount && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-gray-600">Diskon</span>
                                            <button type="button" onClick={() => { setShowDiscount(false); setDiscountTotal(0); }}
                                                className="text-red-400 hover:text-red-600"><Trash2 className="size-3" /></button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-400">Rp</span>
                                            <Input type="number" min="0" step="1000" value={discountTotal}
                                                onChange={(e) => setDiscountTotal(parseFloat(e.target.value) || 0)}
                                                className="w-28 h-7 text-sm text-right border-dashed" />
                                        </div>
                                    </div>
                                )}

                                {/* Tax */}
                                {showTax && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-gray-600">Pajak</span>
                                            <Input type="number" min="0" max="100" step="0.5" value={taxPercent}
                                                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                                                className="w-14 h-7 text-xs text-center border-dashed" />
                                            <span className="text-xs text-gray-400">%</span>
                                            <button type="button" onClick={() => { setShowTax(false); setTaxPercent(0); }}
                                                className="text-red-400 hover:text-red-600"><Trash2 className="size-3" /></button>
                                        </div>
                                        <span className="text-sm font-medium">{formatRupiah(calculations.ppn)}</span>
                                    </div>
                                )}

                                {/* Shipping */}
                                {showShipping && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-gray-600">Pengiriman</span>
                                            <button type="button" onClick={() => { setShowShipping(false); setShippingCost(0); }}
                                                className="text-red-400 hover:text-red-600"><Trash2 className="size-3" /></button>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-400">Rp</span>
                                            <Input type="number" min="0" step="1000" value={shippingCost}
                                                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                                className="w-28 h-7 text-sm text-right border-dashed" />
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold">Total</span>
                                        <span className="text-sm font-bold">{formatRupiah(calculations.grandTotal)}</span>
                                    </div>
                                </div>

                                {/* Amount Paid */}
                                <div className="flex items-center justify-between gap-2 pt-2">
                                    <span className="text-sm text-gray-600">Jumlah yang dibayarkan</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">Rp</span>
                                        <Input type="number" min="0" step="1000" value={amountPaid}
                                            onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                            className="w-28 h-7 text-sm text-right border-dashed" />
                                    </div>
                                </div>

                                {/* Balance Due */}
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold">Keseimbangan karena</span>
                                        <span className="text-sm font-bold">{formatRupiah(calculations.balanceDue)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
