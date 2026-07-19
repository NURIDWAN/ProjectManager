import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileUpload, PhotoWithCaption } from '@/Components/FileUpload';
import AcMeasurementForm, { AcMeasurementEntry, AcEntryPhotos, EMPTY_PHOTOS } from '@/Components/AcMeasurementForm';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, ClipboardList, Camera } from 'lucide-react';

interface Props {
    clients: { id: number; name: string }[];
    categories: { id: number; name: string; preset_identifier: string | null }[];
}

export default function Create({ clients, categories }: Props) {
    const [clientId, setClientId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [area, setArea] = useState('');
    const [beforePhotos, setBeforePhotos] = useState<PhotoWithCaption[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<PhotoWithCaption[]>([]);
    const [presetData, setPresetData] = useState<AcMeasurementEntry[]>([]);
    const [acPhotos, setAcPhotos] = useState<AcEntryPhotos[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedCategory = categories.find((c) => String(c.id) === categoryId);
    const isAcCategory = selectedCategory?.preset_identifier === 'ac_maintenance';

    const handleCategoryChange = (newValue: string | null) => {
        const newCategory = categories.find((c) => String(c.id) === newValue);
        const wasAcCategory = isAcCategory;
        const willBeAcCategory = newCategory?.preset_identifier === 'ac_maintenance';

        // If changing away from AC category and there's data, confirm before clearing
        if (wasAcCategory && !willBeAcCategory && presetData.length > 0) {
            const hasData = presetData.some((entry) =>
                entry.lokasi || entry.tipe_ac || entry.merek || entry.kapasitas !== ''
            );
            if (hasData) {
                const confirmed = window.confirm(
                    'Data pengukuran AC yang sudah diisi akan dihapus. Lanjutkan?'
                );
                if (!confirmed) {
                    return; // Keep the current category
                }
                setPresetData([]);
                setAcPhotos([]);
            }
        }

        setCategoryId(newValue ?? '');
    };

    const buildFormData = () => {
        const formData = new FormData();
        if (clientId) formData.append('client_id', clientId);
        if (categoryId) formData.append('category_id', categoryId);
        if (description) formData.append('description', description);
        if (area) formData.append('area', area);

        // Include preset_data as JSON when AC category is selected
        if (isAcCategory && presetData.length > 0) {
            formData.append('preset_data', JSON.stringify(presetData));

            // Include per-unit AC photos with captions
            acPhotos.forEach((entryPhotos, entryIndex) => {
                if (entryPhotos) {
                    entryPhotos.before.forEach((photo, photoIdx) => {
                        formData.append(`ac_photos_before_${entryIndex}[]`, photo.file);
                        formData.append(`ac_captions_before_${entryIndex}[]`, photo.caption);
                    });
                    entryPhotos.after.forEach((photo, photoIdx) => {
                        formData.append(`ac_photos_after_${entryIndex}[]`, photo.file);
                        formData.append(`ac_captions_after_${entryIndex}[]`, photo.caption);
                    });
                }
            });
        }

        beforePhotos.forEach((photo, index) => {
            formData.append('before_photos[]', photo.file);
            formData.append(`before_captions[${index}]`, photo.caption);
        });
        afterPhotos.forEach((photo, index) => {
            formData.append('after_photos[]', photo.file);
            formData.append(`after_captions[${index}]`, photo.caption);
        });

        return formData;
    };

    const handleSaveDraft = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const formData = buildFormData();

        router.post('/work-reports', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Laporan kerja berhasil disimpan sebagai draft.');
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Gagal menyimpan laporan kerja.');
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Client-side validation for submit
        const validationErrors: Record<string, string> = {};
        if (!clientId) validationErrors.client_id = 'Klien wajib dipilih.';
        if (!categoryId) validationErrors.category_id = 'Kategori wajib dipilih.';
        if (!description.trim()) validationErrors.description = 'Deskripsi wajib diisi.';
        // AC category uses per-unit photos, so skip global after_photos requirement
        if (!isAcCategory && afterPhotos.length === 0) validationErrors.after_photos = 'Minimal satu foto sesudah harus di-upload.';

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Lengkapi data yang diperlukan sebelum submit.');
            setProcessing(false);
            return;
        }

        const formData = buildFormData();
        formData.append('_submit', '1');

        router.post('/work-reports', formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Laporan kerja berhasil disimpan dan disubmit.');
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Gagal menyimpan laporan kerja.');
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href="/work-reports">
                        <Button variant="ghost" size="icon-sm">
                            <ArrowLeft className="size-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Buat Laporan Kerja
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Buat laporan kerja baru untuk dicatat ke sistem
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Buat Laporan Kerja" />

            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-0">
                <form className="space-y-6">
                    {/* Detail Pekerjaan */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ClipboardList className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Detail Pekerjaan</CardTitle>
                                    <CardDescription>
                                        Informasi klien, kategori, dan deskripsi aktivitas
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Klien */}
                            <div className="space-y-2">
                                <Label htmlFor="client_id">Klien</Label>
                                <Select value={clientId} onValueChange={(v) => setClientId(v ?? '')} items={Object.fromEntries(clients.map(c => [String(c.id), c.name]))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih klien" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem
                                                key={client.id}
                                                value={String(client.id)}
                                                label={client.name}
                                            >
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.client_id && (
                                    <p className="text-sm text-destructive">{errors.client_id}</p>
                                )}
                            </div>

                            {/* Kategori */}
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Kategori Pekerjaan</Label>
                                <Select value={categoryId} onValueChange={handleCategoryChange} items={Object.fromEntries(categories.map(c => [String(c.id), c.name]))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={String(cat.id)}
                                                label={cat.name}
                                            >
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && (
                                    <p className="text-sm text-destructive">{errors.category_id}</p>
                                )}
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi Aktivitas</Label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Jelaskan aktivitas pekerjaan..."
                                    rows={4}
                                    className="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    aria-invalid={!!errors.description}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>

                            {/* Area */}
                            <div className="space-y-2">
                                <Label htmlFor="area">Area</Label>
                                <Input
                                    id="area"
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    placeholder="Contoh: Area Floor (GREE 20 PK)"
                                />
                                {errors.area && (
                                    <p className="text-sm text-destructive">{errors.area}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AC Measurement Form - conditionally rendered */}
                    {isAcCategory && (
                        <AcMeasurementForm
                            entries={presetData}
                            onChange={setPresetData}
                            errors={errors}
                            photos={acPhotos}
                            onPhotosChange={setAcPhotos}
                        />
                    )}

                    {/* Dokumentasi Foto - hidden for AC category since photos are per unit */}
                    {!isAcCategory && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Camera className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Dokumentasi Foto</CardTitle>
                                    <CardDescription>
                                        Upload foto sebelum dan sesudah pekerjaan dengan keterangan
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Foto Sebelum */}
                            <div className="space-y-2">
                                <Label>Foto Sebelum</Label>
                                <FileUpload
                                    label="Upload foto sebelum"
                                    withCaption
                                    onPhotosChange={setBeforePhotos}
                                    onChange={() => {}}
                                    error={errors.before_photos}
                                />
                            </div>

                            {/* Foto Sesudah */}
                            <div className="space-y-2">
                                <Label>Foto Sesudah</Label>
                                <FileUpload
                                    label="Upload foto sesudah"
                                    withCaption
                                    onPhotosChange={setAfterPhotos}
                                    onChange={() => {}}
                                    error={errors.after_photos}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                        <Link href="/work-reports">
                            <Button type="button" variant="ghost">
                                Batal
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                                onClick={handleSaveDraft}
                            >
                                <Save className="mr-2 size-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Draft'}
                            </Button>
                            <Button
                                type="button"
                                disabled={processing}
                                onClick={handleSubmit}
                            >
                                <Send className="mr-2 size-4" />
                                {processing ? 'Menyimpan...' : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
