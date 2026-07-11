import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileUpload } from '@/Components/FileUpload';
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

interface WorkReport {
    id: number;
    client_id: number | null;
    category_id: number | null;
    technician_id: number;
    description: string | null;
    status: 'draft' | 'submitted';
    submitted_at: string | null;
    before_photos: string[] | null;
    after_photos: string[] | null;
    created_at: string;
}

interface Props {
    workReport: WorkReport;
    clients: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function Edit({ workReport, clients, categories }: Props) {
    const [clientId, setClientId] = useState(
        workReport.client_id ? String(workReport.client_id) : ''
    );
    const [categoryId, setCategoryId] = useState(
        workReport.category_id ? String(workReport.category_id) : ''
    );
    const [description, setDescription] = useState(workReport.description || '');
    const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
    const [existingBeforePhotos, setExistingBeforePhotos] = useState<string[]>(
        workReport.before_photos || []
    );
    const [existingAfterPhotos, setExistingAfterPhotos] = useState<string[]>(
        workReport.after_photos || []
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const buildFormData = () => {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        if (clientId) formData.append('client_id', clientId);
        if (categoryId) formData.append('category_id', categoryId);
        if (description) formData.append('description', description);

        // Existing photos that user kept
        existingBeforePhotos.forEach((path) => {
            formData.append('existing_before_photos[]', path);
        });
        existingAfterPhotos.forEach((path) => {
            formData.append('existing_after_photos[]', path);
        });

        // New photos
        beforePhotos.forEach((file) => {
            formData.append('before_photos[]', file);
        });
        afterPhotos.forEach((file) => {
            formData.append('after_photos[]', file);
        });

        return formData;
    };

    const handleSaveDraft = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const formData = buildFormData();

        router.post(`/work-reports/${workReport.id}`, formData, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Laporan kerja berhasil diperbarui.');
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Gagal memperbarui laporan kerja.');
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
        if (existingAfterPhotos.length === 0 && afterPhotos.length === 0) {
            validationErrors.after_photos = 'Minimal satu foto sesudah harus di-upload.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Lengkapi data yang diperlukan sebelum submit.');
            setProcessing(false);
            return;
        }

        // Save first, then submit
        const formData = buildFormData();

        router.post(`/work-reports/${workReport.id}`, formData, {
            forceFormData: true,
            onSuccess: () => {
                // After save, submit
                router.post(`/work-reports/${workReport.id}/submit`, {}, {
                    onSuccess: () => {
                        toast.success('Laporan kerja berhasil disubmit.');
                    },
                    onError: (errs) => {
                        const errorMsg = Object.values(errs).flat().join(', ');
                        toast.error(errorMsg || 'Gagal submit laporan kerja.');
                    },
                });
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Gagal memperbarui laporan kerja.');
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const removeExistingBeforePhoto = (path: string) => {
        setExistingBeforePhotos((prev) => prev.filter((p) => p !== path));
    };

    const removeExistingAfterPhoto = (path: string) => {
        setExistingAfterPhotos((prev) => prev.filter((p) => p !== path));
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
                            Edit Laporan Kerja
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Perbarui data laporan kerja
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Edit Laporan Kerja" />

            <div className="mx-auto max-w-2xl">
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
                                <Select value={clientId} onValueChange={(v) => setClientId(v ?? '')}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih klien" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem
                                                key={client.id}
                                                value={String(client.id)}
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
                                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={String(cat.id)}
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
                        </CardContent>
                    </Card>

                    {/* Dokumentasi Foto */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Camera className="size-5 text-muted-foreground" />
                                <div>
                                    <CardTitle className="text-base">Dokumentasi Foto</CardTitle>
                                    <CardDescription>
                                        Upload foto sebelum dan sesudah pekerjaan
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
                                    onChange={setBeforePhotos}
                                    existingFiles={existingBeforePhotos}
                                    onRemoveExisting={removeExistingBeforePhoto}
                                    error={errors.before_photos}
                                />
                            </div>

                            {/* Foto Sesudah */}
                            <div className="space-y-2">
                                <Label>Foto Sesudah</Label>
                                <FileUpload
                                    label="Upload foto sesudah"
                                    onChange={setAfterPhotos}
                                    existingFiles={existingAfterPhotos}
                                    onRemoveExisting={removeExistingAfterPhoto}
                                    error={errors.after_photos}
                                />
                            </div>
                        </CardContent>
                    </Card>

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
