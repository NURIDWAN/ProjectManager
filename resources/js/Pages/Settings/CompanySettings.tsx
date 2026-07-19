import { useState, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    Building2,
    Upload,
    X,
    Save,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Image,
} from 'lucide-react';

interface Props {
    settings: Record<string, string>;
}

export default function CompanySettings({ settings }: Props) {
    const [form, setForm] = useState({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_address_2: settings.company_address_2 || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        bank_name: settings.bank_name || '',
        bank_account_name: settings.bank_account_name || '',
        bank_account_number: settings.bank_account_number || '',
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        settings.company_logo ? `/storage/${settings.company_logo}` : null
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const logoInputRef = useRef<HTMLInputElement>(null);

    const { flash } = usePage().props as any;

    if (flash?.success) {
        toast.success(flash.success);
    }

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        }
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            toast.error('Logo harus berformat JPG atau PNG.');
            return;
        }
        if (file.size > 1024 * 1024) {
            toast.error('Ukuran logo maksimal 1MB.');
            return;
        }

        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleRemoveLogo = () => {
        if (settings.company_logo) {
            // Remove from server
            router.delete('/settings/company/logo', {
                onSuccess: () => {
                    setLogoFile(null);
                    setLogoPreview(null);
                    toast.success('Logo berhasil dihapus.');
                },
                onError: () => {
                    toast.error('Gagal menghapus logo.');
                },
            });
        } else {
            setLogoFile(null);
            setLogoPreview(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            formData.append(key, value);
        });

        if (logoFile) {
            formData.append('company_logo', logoFile);
        }

        router.post('/settings/company', formData, {
            forceFormData: true,
            onSuccess: () => {
                setLogoFile(null);
                toast.success('Pengaturan berhasil disimpan.');
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Gagal menyimpan pengaturan.');
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Pengaturan Perusahaan
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Kelola informasi perusahaan yang tampil di surat BAP dan Invoice
                    </p>
                </div>
            }
        >
            <Head title="Pengaturan Perusahaan" />

            <div className="mx-auto max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo & Nama Perusahaan */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Building2 className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Identitas Perusahaan</CardTitle>
                                    <CardDescription>
                                        Logo dan nama perusahaan yang tampil di header dokumen
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <Label>Logo Perusahaan</Label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <div className="relative">
                                            <img
                                                src={logoPreview}
                                                alt="Logo perusahaan"
                                                className="size-20 rounded-lg border object-contain p-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -right-2 -top-2 size-6"
                                                onClick={handleRemoveLogo}
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => logoInputRef.current?.click()}
                                            className="flex size-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
                                        >
                                            <Image className="size-6 text-muted-foreground" />
                                            <span className="mt-1 text-[10px] text-muted-foreground">
                                                Upload
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            <Upload className="mr-2 size-4" />
                                            {logoPreview ? 'Ganti Logo' : 'Pilih Logo'}
                                        </Button>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            JPG/PNG, maks 1MB. Rekomendasi: 200x200px
                                        </p>
                                    </div>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png"
                                        onChange={handleLogoSelect}
                                        className="sr-only"
                                    />
                                </div>
                                {errors.company_logo && (
                                    <p className="text-sm text-destructive">{errors.company_logo}</p>
                                )}
                            </div>

                            <Separator />

                            {/* Nama Perusahaan */}
                            <div className="space-y-2">
                                <Label htmlFor="company_name">
                                    Nama Perusahaan <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="company_name"
                                    value={form.company_name}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    placeholder="PT Perusahaan Anda"
                                    aria-invalid={!!errors.company_name}
                                />
                                {errors.company_name && (
                                    <p className="text-sm text-destructive">{errors.company_name}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alamat & Kontak */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MapPin className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Alamat & Kontak</CardTitle>
                                    <CardDescription>
                                        Alamat, nomor telepon, dan email perusahaan
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_address">Alamat Baris 1</Label>
                                <Input
                                    id="company_address"
                                    value={form.company_address}
                                    onChange={(e) => handleChange('company_address', e.target.value)}
                                    placeholder="Gedung/Lantai"
                                    aria-invalid={!!errors.company_address}
                                />
                                {errors.company_address && (
                                    <p className="text-sm text-destructive">{errors.company_address}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company_address_2">Alamat Baris 2</Label>
                                <Input
                                    id="company_address_2"
                                    value={form.company_address_2}
                                    onChange={(e) => handleChange('company_address_2', e.target.value)}
                                    placeholder="Jalan, Kota, Kode Pos"
                                    aria-invalid={!!errors.company_address_2}
                                />
                                {errors.company_address_2 && (
                                    <p className="text-sm text-destructive">{errors.company_address_2}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="company_phone">
                                        <Phone className="mr-1 inline size-3.5" />
                                        No. Telepon
                                    </Label>
                                    <Input
                                        id="company_phone"
                                        value={form.company_phone}
                                        onChange={(e) => handleChange('company_phone', e.target.value)}
                                        placeholder="021 1234567"
                                        aria-invalid={!!errors.company_phone}
                                    />
                                    {errors.company_phone && (
                                        <p className="text-sm text-destructive">{errors.company_phone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company_email">
                                        <Mail className="mr-1 inline size-3.5" />
                                        Email
                                    </Label>
                                    <Input
                                        id="company_email"
                                        type="email"
                                        value={form.company_email}
                                        onChange={(e) => handleChange('company_email', e.target.value)}
                                        placeholder="info@perusahaan.com"
                                        aria-invalid={!!errors.company_email}
                                    />
                                    {errors.company_email && (
                                        <p className="text-sm text-destructive">{errors.company_email}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informasi Bank */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Informasi Bank</CardTitle>
                                    <CardDescription>
                                        Detail rekening yang tampil di Invoice untuk pembayaran
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bank_name">Nama Bank / Cabang</Label>
                                <Input
                                    id="bank_name"
                                    value={form.bank_name}
                                    onChange={(e) => handleChange('bank_name', e.target.value)}
                                    placeholder="Mandiri Cabang Pluit Jakarta Utara"
                                    aria-invalid={!!errors.bank_name}
                                />
                                {errors.bank_name && (
                                    <p className="text-sm text-destructive">{errors.bank_name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bank_account_name">Atas Nama</Label>
                                    <Input
                                        id="bank_account_name"
                                        value={form.bank_account_name}
                                        onChange={(e) => handleChange('bank_account_name', e.target.value)}
                                        placeholder="PT Perusahaan Anda"
                                        aria-invalid={!!errors.bank_account_name}
                                    />
                                    {errors.bank_account_name && (
                                        <p className="text-sm text-destructive">{errors.bank_account_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bank_account_number">No. Rekening</Label>
                                    <Input
                                        id="bank_account_number"
                                        value={form.bank_account_number}
                                        onChange={(e) => handleChange('bank_account_number', e.target.value)}
                                        placeholder="1234567890"
                                        aria-invalid={!!errors.bank_account_number}
                                    />
                                    {errors.bank_account_number && (
                                        <p className="text-sm text-destructive">{errors.bank_account_number}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} size="lg">
                            <Save className="mr-2 size-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
