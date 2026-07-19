import { useState, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FileUpload, PhotoWithCaption, ExistingPhoto } from '@/Components/FileUpload';
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
import { ArrowLeft, Save, Send, ClipboardList, Camera, Thermometer } from 'lucide-react';

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
    before_photos_rel?: ExistingPhoto[];
    after_photos_rel?: ExistingPhoto[];
    preset_data?: AcMeasurementEntry[] | null;
    created_at: string;
}

interface Category {
    id: number;
    name: string;
    preset_identifier?: string | null;
}

interface Props {
    workReport: WorkReport;
    clients: { id: number; name: string }[];
    categories: Category[];
}

const EMPTY_ENTRY: AcMeasurementEntry = {
    lokasi: '',
    tipe_ac: '',
    merek: '',
    kapasitas: '',
    suhu_before_r: '',
    suhu_before_s: '',
    suhu_before_t: '',
    suhu_after_r: '',
    suhu_after_s: '',
    suhu_after_t: '',
    ampere_before_r: '',
    ampere_before_s: '',
    ampere_before_t: '',
    ampere_after_r: '',
    ampere_after_s: '',
    ampere_after_t: '',
    freon_before: '',
    freon_after: '',
    keterangan: '',
};

export default function Edit({ workReport, clients, categories }: Props) {
    const [clientId, setClientId] = useState(
        workReport.client_id ? String(workReport.client_id) : ''
    );
    const [categoryId, setCategoryId] = useState(
        workReport.category_id ? String(workReport.category_id) : ''
    );
    const [description, setDescription] = useState(workReport.description || '');
    const [area, setArea] = useState((workReport as any).area || '');
    const [beforePhotos, setBeforePhotos] = useState<PhotoWithCaption[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<PhotoWithCaption[]>([]);
    const [existingBeforePhotos, setExistingBeforePhotos] = useState<ExistingPhoto[]>(
        (workReport as any).before_photos_data || []
    );
    const [existingAfterPhotos, setExistingAfterPhotos] = useState<ExistingPhoto[]>(
        (workReport as any).after_photos_data || []
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // AC Measurement preset state
    const [presetData, setPresetData] = useState<AcMeasurementEntry[]>(() => {
        if (workReport.preset_data && Array.isArray(workReport.preset_data) && workReport.preset_data.length > 0) {
            return workReport.preset_data;
        }
        return [{ ...EMPTY_ENTRY }];
    });

    // AC per-unit photos state
    const [acPhotos, setAcPhotos] = useState<AcEntryPhotos[]>(() => {
        // Initialize from existing ac_unit_photos if available
        const unitPhotos = (workReport as any).ac_unit_photos;
        if (unitPhotos && Array.isArray(unitPhotos)) {
            return unitPhotos.map((unitPhoto: any) => ({
                before: [],
                after: [],
                existingBefore: unitPhoto?.before ?? [],
                existingAfter: unitPhoto?.after ?? [],
            }));
        }
        // Default: one empty entry per preset data entry
        const dataLen = workReport.preset_data && Array.isArray(workReport.preset_data) ? workReport.preset_data.length : 1;
        return Array.from({ length: dataLen }, () => ({ ...EMPTY_PHOTOS }));
    });

    // Confirmation dialog state for category change away from AC
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const pendingCategoryId = useRef<string>('');

    // Determine if the currently selected category is AC
    const getSelectedCategory = (catId: string): Category | undefined => {
        return categories.find((c) => String(c.id) === catId);
    };

    const isAcCategory = (catId: string): boolean => {
        const cat = getSelectedCategory(catId);
        return cat?.preset_identifier === 'ac_maintenance';
    };

    const selectedCategoryIsAc = isAcCategory(categoryId);

    // Check if preset data has any meaningful entries (non-empty)
    const hasPresetData = (): boolean => {
        return presetData.some((entry) =>
            entry.lokasi.trim() !== '' ||
            entry.tipe_ac !== '' ||
            entry.merek !== '' ||
            entry.kapasitas !== ''
        );
    };

    const handleCategoryChange = (newCategoryId: string | null) => {
        if (!newCategoryId) {
            setCategoryId('');
            return;
        }

        const currentIsAc = isAcCategory(categoryId);
        const newIsAc = isAcCategory(newCategoryId);

        // If changing away from AC category and there's data entered, show confirmation
        if (currentIsAc && !newIsAc && hasPresetData()) {
            pendingCategoryId.current = newCategoryId;
            setShowDiscardDialog(true);
            return;
        }

        setCategoryId(newCategoryId);

        // If switching to AC category and preset data is empty, initialize with one entry
        if (newIsAc && !currentIsAc) {
            if (presetData.length === 0 || !hasPresetData()) {
                setPresetData([{ ...EMPTY_ENTRY }]);
            }
        }
    };

    const handleConfirmDiscard = () => {
        setCategoryId(pendingCategoryId.current);
        setPresetData([{ ...EMPTY_ENTRY }]);
        setAcPhotos([{ ...EMPTY_PHOTOS }]);
        setShowDiscardDialog(false);
    };

    const handleCancelDiscard = () => {
        setShowDiscardDialog(false);
        pendingCategoryId.current = '';
    };

    const buildFormData = () => {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        if (clientId) formData.append('client_id', clientId);
        if (categoryId) formData.append('category_id', categoryId);
        if (description) formData.append('description', description);
        if (area) formData.append('area', area);

        // Include preset_data if the selected category is AC
        if (selectedCategoryIsAc) {
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
                    // Send existing photo IDs that user kept
                    entryPhotos.existingBefore.forEach((photo) => {
                        formData.append(`ac_existing_before_${entryIndex}[]`, String(photo.id));
                    });
                    entryPhotos.existingAfter.forEach((photo) => {
                        formData.append(`ac_existing_after_${entryIndex}[]`, String(photo.id));
                    });
                }
            });
        }

        // Existing photos that user kept (send IDs)
        existingBeforePhotos.forEach((photo) => {
            formData.append('existing_before_photos[]', String(photo.id));
        });
        existingAfterPhotos.forEach((photo) => {
            formData.append('existing_after_photos[]', String(photo.id));
        });

        // New photos with captions
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
        // AC category uses per-unit photos, so skip global after_photos requirement
        if (!selectedCategoryIsAc && existingAfterPhotos.length === 0 && afterPhotos.length === 0) {
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

    const removeExistingBeforePhoto = (id: number) => {
        setExistingBeforePhotos((prev) => prev.filter((p) => p.id !== id));
    };

    const removeExistingAfterPhoto = (id: number) => {
        setExistingAfterPhotos((prev) => prev.filter((p) => p.id !== id));
    };

    const updateExistingBeforeCaption = (id: number, caption: string) => {
        setExistingBeforePhotos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, caption } : p))
        );
    };

    const updateExistingAfterCaption = (id: number, caption: string) => {
        setExistingAfterPhotos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, caption } : p))
        );
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArea(e.target.value)}
                                    placeholder="Contoh: Area Floor (GREE 20 PK)"
                                />
                                {errors.area && (
                                    <p className="text-sm text-destructive">{errors.area}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AC Measurement Form - conditionally rendered */}
                    {selectedCategoryIsAc && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Thermometer className="size-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-base">Data Pengukuran AC</CardTitle>
                                        <CardDescription>
                                            Input data pengukuran teknis unit AC (suhu, ampere, tekanan freon)
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <AcMeasurementForm
                                    entries={presetData}
                                    onChange={setPresetData}
                                    errors={errors}
                                    disabled={workReport.status === 'submitted'}
                                    photos={acPhotos}
                                    onPhotosChange={setAcPhotos}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Dokumentasi Foto - hidden for AC category since photos are per unit */}
                    {!selectedCategoryIsAc && (
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
                                    existingPhotos={existingBeforePhotos}
                                    onRemoveExistingPhoto={removeExistingBeforePhoto}
                                    onUpdateExistingCaption={updateExistingBeforeCaption}
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
                                    existingPhotos={existingAfterPhotos}
                                    onRemoveExistingPhoto={removeExistingAfterPhoto}
                                    onUpdateExistingCaption={updateExistingAfterCaption}
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

            {/* Confirmation dialog for discarding AC data on category change */}
            <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data Pengukuran AC?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda telah mengisi data pengukuran AC. Mengganti kategori akan menghapus semua data pengukuran yang sudah diisi. Apakah Anda yakin ingin melanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDiscard}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={handleConfirmDiscard}>
                            Ya, Hapus Data
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthenticatedLayout>
    );
}
