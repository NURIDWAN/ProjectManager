import { Head, Link, useForm, router } from '@inertiajs/react';
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
import { toast } from 'sonner';
import { ArrowLeft, Building2, UserCircle, Save, Upload, X } from 'lucide-react';
import { useState, useRef } from 'react';

interface Client {
    id: number;
    name: string;
    logo: string | null;
    npwp: string | null;
    address: string;
    phone: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    is_active: boolean;
}

interface Props {
    client: Client;
}

export default function ClientsEdit({ client }: Props) {
    const { data, setData, processing, errors } = useForm({
        name: client.name,
        npwp: client.npwp || '',
        address: client.address,
        phone: client.phone || '',
        pic_name: client.pic_name || '',
        pic_phone: client.pic_phone || '',
        is_active: client.is_active,
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        client.logo ? `/storage/${client.logo}` : null
    );
    const [removeLogo, setRemoveLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
            setRemoveLogo(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        if (logoPreview && !client.logo) URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
        setRemoveLogo(true);
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('npwp', data.npwp);
        formData.append('address', data.address);
        formData.append('phone', data.phone);
        formData.append('pic_name', data.pic_name);
        formData.append('pic_phone', data.pic_phone);
        formData.append('is_active', data.is_active ? '1' : '0');
        if (logoFile) formData.append('logo', logoFile);
        if (removeLogo) formData.append('remove_logo', '1');

        router.post(`/clients/${client.id}`, formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Klien berhasil diperbarui.');
            },
            onError: () => {
                toast.error('Gagal memperbarui klien. Periksa form dan coba lagi.');
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
                            Edit Klien
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Perbarui data klien: {client.name}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit Klien - ${client.name}`} />

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
                            {/* Logo */}
                            <div className="space-y-2">
                                <Label>Logo Perusahaan</Label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <div className="relative">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="h-16 w-auto rounded border object-contain"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon-sm"
                                                className="absolute -right-2 -top-2"
                                                onClick={handleRemoveLogo}
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => logoInputRef.current?.click()}
                                            className="flex h-16 w-32 cursor-pointer items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
                                        >
                                            <Upload className="size-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png"
                                        onChange={handleLogoChange}
                                        className="sr-only"
                                    />
                                    {!logoPreview && (
                                        <p className="text-xs text-muted-foreground">
                                            JPG/PNG, maks 2MB
                                        </p>
                                    )}
                                </div>
                                {(errors as any).logo && (
                                    <p className="text-sm text-destructive">{(errors as any).logo}</p>
                                )}
                            </div>

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

                            {/* Telepon Perusahaan */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telepon Perusahaan</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="021-12345678"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">{errors.phone}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.is_active ? 'active' : 'inactive'}
                                    onValueChange={(value) => setData('is_active', value === 'active')}
                                    items={{ active: 'Aktif', inactive: 'Nonaktif' }}
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
                                    <Label htmlFor="pic_phone">Nomor Telepon PIC</Label>
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
                                {processing ? 'Menyimpan...' : 'Perbarui Klien'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
