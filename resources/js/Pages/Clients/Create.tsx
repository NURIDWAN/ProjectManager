import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Building2, UserCircle, Save } from 'lucide-react';

export default function ClientsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        npwp: '',
        address: '',
        pic_name: '',
        pic_phone: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/clients', {
            onSuccess: () => {
                toast.success('Klien berhasil ditambahkan.');
            },
            onError: () => {
                toast.error('Gagal menyimpan klien. Periksa form dan coba lagi.');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/clients">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Tambah Klien
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Isi data klien baru untuk ditambahkan ke sistem
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tambah Klien" />

            <div className="mx-auto max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informasi Perusahaan */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Informasi Perusahaan</CardTitle>
                                    <CardDescription>
                                        Data utama perusahaan klien
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Nama */}
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama Perusahaan <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="PT. Contoh Perusahaan"
                                    aria-invalid={!!errors.name}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* NPWP */}
                            <div className="space-y-2">
                                <Label htmlFor="npwp">NPWP</Label>
                                <Input
                                    id="npwp"
                                    value={data.npwp}
                                    onChange={(e) => setData('npwp', e.target.value)}
                                    placeholder="XX.XXX.XXX.X-XXX.XXX"
                                />
                                {errors.npwp && (
                                    <p className="text-sm text-destructive">{errors.npwp}</p>
                                )}
                            </div>

                            {/* Alamat */}
                            <div className="space-y-2">
                                <Label htmlFor="address">
                                    Alamat <span className="text-destructive">*</span>
                                </Label>
                                <textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Jl. Contoh No. 123, Jakarta"
                                    rows={3}
                                    className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                    aria-invalid={!!errors.address}
                                />
                                {errors.address && (
                                    <p className="text-sm text-destructive">{errors.address}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.is_active ? 'active' : 'inactive'}
                                    onValueChange={(value) => setData('is_active', value === 'active')}
                                >
                                    <SelectTrigger id="status" className="w-full">
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-emerald-500" />
                                                Aktif
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-gray-400" />
                                                Nonaktif
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Klien nonaktif tidak akan muncul di dropdown laporan kerja
                                </p>
                                {errors.is_active && (
                                    <p className="text-sm text-destructive">{errors.is_active}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informasi PIC */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <UserCircle className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Person in Charge (PIC)</CardTitle>
                                    <CardDescription>
                                        Kontak utama yang bertanggung jawab dari sisi klien
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Nama PIC */}
                                <div className="space-y-2">
                                    <Label htmlFor="pic_name">Nama PIC</Label>
                                    <Input
                                        id="pic_name"
                                        value={data.pic_name}
                                        onChange={(e) => setData('pic_name', e.target.value)}
                                        placeholder="John Doe"
                                    />
                                    {errors.pic_name && (
                                        <p className="text-sm text-destructive">{errors.pic_name}</p>
                                    )}
                                </div>

                                {/* Telepon PIC */}
                                <div className="space-y-2">
                                    <Label htmlFor="pic_phone">Nomor Telepon</Label>
                                    <Input
                                        id="pic_phone"
                                        type="tel"
                                        value={data.pic_phone}
                                        onChange={(e) => setData('pic_phone', e.target.value)}
                                        placeholder="08123456789"
                                    />
                                    {errors.pic_phone && (
                                        <p className="text-sm text-destructive">{errors.pic_phone}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                            <span className="text-destructive">*</span> Menandakan field wajib diisi
                        </p>
                        <div className="flex items-center gap-3">
                            <Link href="/clients">
                                <Button type="button" variant="outline">
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 size-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Klien'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
