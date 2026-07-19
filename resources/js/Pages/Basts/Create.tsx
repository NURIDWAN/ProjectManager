import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Bap {
    id: number;
    nomor_surat: string;
    client_id: number;
    tanggal: string;
    status: 'draft' | 'approved';
    work_report_ids: number[];
    signed_by: string | null;
    client?: {
        id: number;
        name: string;
        address?: string;
        pic_name?: string | null;
    };
}

interface WorkItemInput {
    uraian_pekerjaan: string;
    satuan: string;
    jumlah: number;
    keterangan: string;
}

interface Props {
    availableBaps: Bap[];
}

export default function Create({ availableBaps }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        bap_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        work_items: [{ uraian_pekerjaan: '', satuan: 'Unit', jumlah: 1, keterangan: '' }] as WorkItemInput[],
    });

    const addWorkItem = () => {
        setData('work_items', [
            ...data.work_items,
            { uraian_pekerjaan: '', satuan: 'Unit', jumlah: 1, keterangan: '' },
        ]);
    };

    const removeWorkItem = (index: number) => {
        if (data.work_items.length <= 1) return;
        const updated = data.work_items.filter((_, i) => i !== index);
        setData('work_items', updated);
    };

    const updateWorkItem = (index: number, field: keyof WorkItemInput, value: string | number) => {
        const updated = [...data.work_items];
        updated[index] = { ...updated[index], [field]: value };
        setData('work_items', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/basts', {
            onSuccess: () => {
                toast.success('BAST berhasil dibuat.');
            },
            onError: () => {
                toast.error('Gagal membuat BAST. Periksa form dan coba lagi.');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/basts">
                        <Button variant="ghost" size="icon-sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Buat BAST Baru
                    </h2>
                </div>
            }
        >
            <Head title="Buat BAST" />

            <div className="mx-auto max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* BAP Selector */}
                    <div className="space-y-2">
                        <Label htmlFor="bap_id">
                            Pilih BAP <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.bap_id || 'none'}
                            onValueChange={(value) => setData('bap_id', value === 'none' ? '' : (value ?? ''))}
                            items={Object.fromEntries([['none', '-- Pilih BAP --'], ...availableBaps.map(bap => [String(bap.id), `${bap.nomor_surat} — ${bap.client?.name ?? 'Unknown Client'}`])])}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih BAP yang sudah di-approve" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Pilih BAP --</SelectItem>
                                {availableBaps.map((bap) => (
                                    <SelectItem key={bap.id} value={String(bap.id)} label={`${bap.nomor_surat} — ${bap.client?.name ?? 'Unknown Client'}`}>
                                        {bap.nomor_surat} — {bap.client?.name ?? 'Unknown Client'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.bap_id && (
                            <p className="text-sm text-destructive">{errors.bap_id}</p>
                        )}
                    </div>

                    {/* Tanggal BAST */}
                    <div className="space-y-2">
                        <Label htmlFor="tanggal">
                            Tanggal BAST <span className="text-destructive">*</span>
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

                    <Separator />

                    {/* Uraian Pekerjaan (Manual) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold">Uraian Pekerjaan</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addWorkItem}>
                                <Plus className="mr-1 size-4" />
                                Tambah Item
                            </Button>
                        </div>

                        {errors.work_items && (
                            <p className="text-sm text-destructive">{errors.work_items}</p>
                        )}

                        <div className="space-y-3">
                            {data.work_items.map((item, index) => (
                                <Card key={index}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 space-y-3">
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                                    <div className="md:col-span-5 space-y-1">
                                                        <Label className="text-xs">Uraian Pekerjaan</Label>
                                                        <Input
                                                            value={item.uraian_pekerjaan}
                                                            onChange={(e) => updateWorkItem(index, 'uraian_pekerjaan', e.target.value)}
                                                            placeholder="Nama pekerjaan/service"
                                                            aria-invalid={!!(errors as any)[`work_items.${index}.uraian_pekerjaan`]}
                                                        />
                                                        {(errors as any)[`work_items.${index}.uraian_pekerjaan`] && (
                                                            <p className="text-xs text-destructive">
                                                                {(errors as any)[`work_items.${index}.uraian_pekerjaan`]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="md:col-span-2 space-y-1">
                                                        <Label className="text-xs">Satuan</Label>
                                                        <Input
                                                            value={item.satuan}
                                                            onChange={(e) => updateWorkItem(index, 'satuan', e.target.value)}
                                                            placeholder="Unit"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-1">
                                                        <Label className="text-xs">Jumlah</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={item.jumlah}
                                                            onChange={(e) => updateWorkItem(index, 'jumlah', parseInt(e.target.value) || 1)}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3 space-y-1">
                                                        <Label className="text-xs">Keterangan</Label>
                                                        <Input
                                                            value={item.keterangan}
                                                            onChange={(e) => updateWorkItem(index, 'keterangan', e.target.value)}
                                                            placeholder="Opsional"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeWorkItem(index)}
                                                disabled={data.work_items.length <= 1}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Buat BAST'}
                        </Button>
                        <Link href="/basts">
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
