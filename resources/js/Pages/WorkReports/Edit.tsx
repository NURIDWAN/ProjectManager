import { useCallback, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DraftPhotoUpload, DraftPhoto } from '@/Components/DraftPhotoUpload';
import AcMeasurementForm, {
    AcMeasurementEntry,
    AcEntryPhotos,
    EMPTY_ENTRY,
    EMPTY_PHOTOS,
    normalizeAcMeasurementEntry,
} from '@/Components/AcMeasurementForm';
import { SaveStatusIndicator } from '@/Components/SaveStatusIndicator';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Send,
    ClipboardList,
    Camera,
    Thermometer,
    UserRoundCog,
    TriangleAlert,
} from 'lucide-react';
import { useWorkReportAutosave } from '@/hooks/useWorkReportAutosave';

interface ExistingPhoto {
    id: number;
    photo_path: string;
    caption: string | null;
    photo_url: string;
    sort_order: number;
}

interface AcExistingPhoto {
    id: number;
    photo_url: string;
    caption: string | null;
}

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
    before_photos_data?: ExistingPhoto[];
    after_photos_data?: ExistingPhoto[];
    preset_data?: AcMeasurementEntry[] | null;
    ac_unit_photos?: { before: AcExistingPhoto[]; after: AcExistingPhoto[] }[];
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

interface AcEntryPhotosWithIds extends AcEntryPhotos {
    existingBefore: AcExistingPhoto[];
    existingAfter: AcExistingPhoto[];
}

const toExistingPhoto = (photo: DraftPhoto): ExistingPhoto => ({
    id: photo.id,
    photo_path: '',
    caption: photo.caption,
    photo_url: photo.photo_url,
    sort_order: 0,
});

/** Map server-side existing photos to the shape DraftPhotoUpload expects. */
const toDraftPhoto = (photo: ExistingPhoto): DraftPhoto => ({
    id: photo.id,
    photo_url: photo.photo_url,
    caption: photo.caption ?? '',
});

export default function Edit({ workReport, clients, categories }: Props) {
    const isDraft = workReport.status === 'draft';

    const [clientId, setClientId] = useState(
        workReport.client_id ? String(workReport.client_id) : ''
    );
    const [categoryId, setCategoryId] = useState(
        workReport.category_id ? String(workReport.category_id) : ''
    );
    const [description, setDescription] = useState(workReport.description || '');
    const [area, setArea] = useState((workReport as any).area || '');
    const [existingBeforePhotos, setExistingBeforePhotos] = useState<ExistingPhoto[]>(
        workReport.before_photos_data || []
    );
    const [existingAfterPhotos, setExistingAfterPhotos] = useState<ExistingPhoto[]>(
        workReport.after_photos_data || []
    );
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // AC Measurement preset state
    const [presetData, setPresetData] = useState<AcMeasurementEntry[]>(() => {
        if (workReport.preset_data && Array.isArray(workReport.preset_data) && workReport.preset_data.length > 0) {
            return workReport.preset_data.map((entry) =>
                normalizeAcMeasurementEntry(entry as unknown as Record<string, unknown>)
            );
        }
        return [{ ...EMPTY_ENTRY }];
    });

    // AC per-unit photos state
    const [acPhotos, setAcPhotos] = useState<AcEntryPhotosWithIds[]>(() => {
        const unitPhotos = workReport.ac_unit_photos;
        if (unitPhotos && Array.isArray(unitPhotos)) {
            return unitPhotos.map((unitPhoto: any) => ({
                before: [],
                after: [],
                existingBefore: unitPhoto?.before ?? [],
                existingAfter: unitPhoto?.after ?? [],
            }));
        }
        const dataLen = workReport.preset_data && Array.isArray(workReport.preset_data) ? workReport.preset_data.length : 1;
        return Array.from({ length: dataLen }, () => ({ ...EMPTY_PHOTOS }) as AcEntryPhotosWithIds);
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

    // Detail Pekerjaan harus lengkap (draft only) sebelum dokumentasi bisa diakses
    const isDetailComplete = Boolean(clientId && categoryId && description.trim() && area.trim());

    // === Autosave wiring (drafts only) ===

    const buildAutosavePayload = useCallback((): Record<string, unknown> | false => {
        if (!isDraft) {
            return false;
        }

        const allPhotos: { id: number; caption: string }[] = [
            ...existingBeforePhotos,
            ...existingAfterPhotos,
        ].map((p) => ({ id: p.id, caption: p.caption ?? '' }));

        acPhotos.forEach((entry) => {
            [...entry.existingBefore, ...entry.existingAfter].forEach((p) => {
                allPhotos.push({ id: p.id, caption: p.caption ?? '' });
            });
        });

        // AC unit remap: send new unit index for each existing AC photo
        const acPhotoRemap: Record<string, number> = {};
        acPhotos.forEach((entry, unitIndex) => {
            [...entry.existingBefore, ...entry.existingAfter].forEach((p) => {
                acPhotoRemap[String(p.id)] = unitIndex;
            });
        });

        return {
            client_id: clientId || null,
            category_id: categoryId || null,
            description: description || null,
            area: area || null,
            preset_data:
                selectedCategoryIsAc && presetData.length > 0 ? JSON.stringify(presetData) : null,
            photo_captions: Object.fromEntries(allPhotos.map((p) => [String(p.id), p.caption])),
            ac_photo_remap: acPhotoRemap,
            existing_before_photos: existingBeforePhotos.map((p) => p.id),
            existing_after_photos: existingAfterPhotos.map((p) => p.id),
        };
    }, [isDraft, clientId, categoryId, description, area, presetData, selectedCategoryIsAc, existingBeforePhotos, existingAfterPhotos, acPhotos]);

    const { state, lastSavedAt, markDirty, flush, reset } = useWorkReportAutosave({
        buildPayload: buildAutosavePayload,
        onError: (message) => toast.error(message),
    });

    const touch = () => {
        if (isDraft) markDirty();
    };

    const getCsrf = () =>
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    // === Category change ===

    const handleCategoryChange = (newCategoryId: string | null) => {
        if (!newCategoryId) {
            setCategoryId('');
            touch();
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
        touch();

        // If switching to AC category and preset data is empty, initialize with one entry
        if (newIsAc && !currentIsAc) {
            if (presetData.length === 0 || !hasPresetData()) {
                setPresetData([{ ...EMPTY_ENTRY }]);
            }
        }
    };

    const hasPresetData = (): boolean => {
        return presetData.some((entry) =>
            entry.lokasi.trim() !== '' ||
            entry.tipe_ac !== '' ||
            entry.merek !== '' ||
            entry.kapasitas !== ''
        );
    };

    const handleConfirmDiscard = () => {
        setCategoryId(pendingCategoryId.current);
        setPresetData([{ ...EMPTY_ENTRY }]);
        setAcPhotos([{ ...EMPTY_PHOTOS }] as AcEntryPhotosWithIds[]);
        setShowDiscardDialog(false);
        touch();
    };

    const handleCancelDiscard = () => {
        setShowDiscardDialog(false);
        pendingCategoryId.current = '';
    };

    // === Existing photo operations (server-synced for drafts) ===

    const removeExistingPhoto = async (list: 'before' | 'after', id: number) => {
        const photo = (list === 'before' ? existingBeforePhotos : existingAfterPhotos)
            .find((p) => p.id === id);
        if (list === 'before') {
            setExistingBeforePhotos((prev) => prev.filter((p) => p.id !== id));
        } else {
            setExistingAfterPhotos((prev) => prev.filter((p) => p.id !== id));
        }

        if (isDraft && photo) {
            await fetch(`/work-reports/${workReport.id}/photos/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
        }
        touch();
    };

    const updateExistingCaption = (list: 'before' | 'after', id: number, caption: string) => {
        if (list === 'before') {
            setExistingBeforePhotos((prev) =>
                prev.map((p) => (p.id === id ? { ...p, caption } : p))
            );
        } else {
            setExistingAfterPhotos((prev) =>
                prev.map((p) => (p.id === id ? { ...p, caption } : p))
            );
        }
        touch();
    };

    // === Manual save / submit ===

    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (isDraft) {
            const saved = await flush();
            if (saved) {
                toast.success('Laporan kerja tersimpan.');
                reset();
                router.visit('/work-reports');
            } else {
                toast.error('Gagal menyimpan draft. Periksa koneksi Anda.');
            }
            setProcessing(false);
            return;
        }

        // Submitted reports cannot be edited by operators anyway; admin fallback
        // to the classic update endpoint.
        const formData = new FormData();
        formData.append('_method', 'PUT');
        if (clientId) formData.append('client_id', clientId);
        if (categoryId) formData.append('category_id', categoryId);
        if (description) formData.append('description', description);
        if (area) formData.append('area', area);
        existingBeforePhotos.forEach((p) => formData.append('existing_before_photos[]', String(p.id)));
        existingAfterPhotos.forEach((p) => formData.append('existing_after_photos[]', String(p.id)));

        router.post(`/work-reports/${workReport.id}`, formData, {
            forceFormData: true,
            onSuccess: () => toast.success('Laporan kerja berhasil diperbarui.'),
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Gagal memperbarui laporan kerja.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Client-side validation for submit
        const validationErrors: Record<string, string> = {};
        if (!clientId) validationErrors.client_id = 'Klien wajib dipilih.';
        if (!categoryId) validationErrors.category_id = 'Kategori wajib dipilih.';
        if (!description.trim()) validationErrors.description = 'Deskripsi wajib diisi.';
        if (!area.trim()) validationErrors.area = 'Area wajib diisi.';
        if (!selectedCategoryIsAc && existingAfterPhotos.length === 0) {
            validationErrors.after_photos = 'Minimal satu foto sesudah harus di-upload.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Lengkapi data yang diperlukan sebelum submit.');
            setProcessing(false);
            return;
        }

        if (isDraft) {
            // Persist latest edits first, then submit
            const saved = await flush();
            if (!saved) {
                toast.error('Gagal menyiapkan laporan. Coba lagi.');
                setProcessing(false);
                return;
            }

            router.post(`/work-reports/${workReport.id}/submit`, {}, {
                onSuccess: () => {
                    toast.success('Laporan kerja berhasil disubmit.');
                },
                onError: (errs) => {
                    const errorMsg = Object.values(errs).flat().join(', ');
                    toast.error(errorMsg || 'Gagal submit laporan kerja.');
                },
                onFinish: () => setProcessing(false),
            });
            return;
        }

        setProcessing(false);
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

            <div className="mx-auto max-w-4xl px-0 sm:px-6 lg:px-0">


                <form className="space-y-6">
                    {/* Detail Pekerjaan */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="size-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-base">Detail Pekerjaan</CardTitle>
                                        <CardDescription>
                                            Informasi klien, kategori, dan deskripsi aktivitas
                                        </CardDescription>
                                    </div>
                                </div>
                                {isDraft && (
                                    <SaveStatusIndicator state={state} lastSavedAt={lastSavedAt} />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Klien */}
                            <div className="space-y-2">
                                <Label htmlFor="client_id">Klien <span className="text-destructive">*</span></Label>
                                <Select value={clientId} onValueChange={(v) => { setClientId(v ?? ''); touch(); }} items={Object.fromEntries(clients.map(c => [String(c.id), c.name]))} disabled={!isDraft}>
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
                                <Label htmlFor="category_id">Kategori Pekerjaan <span className="text-destructive">*</span></Label>
                                <Select value={categoryId} onValueChange={handleCategoryChange} items={Object.fromEntries(categories.map(c => [String(c.id), c.name]))} disabled={!isDraft}>
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
                                <Label htmlFor="description">Deskripsi Aktivitas <span className="text-destructive">*</span></Label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => { setDescription(e.target.value); touch(); }}
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
                                <Label htmlFor="area">Area <span className="text-destructive">*</span></Label>
                                <Input
                                    id="area"
                                    value={area}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setArea(e.target.value); touch(); }}
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
                            <CardContent className="px-3 sm:px-6">
                                {isDraft && !isDetailComplete && (
                                    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                                        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                                Lengkapi Detail Pekerjaan terlebih dahulu
                                            </p>
                                            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                                                Isi semua data wajib (klien, kategori, deskripsi, dan area) sebelum mengisi data pengukuran dan dokumentasi.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <AcMeasurementForm
                                    entries={presetData}
                                    onChange={(entries) => { setPresetData(entries); touch(); }}
                                    errors={errors}
                                    disabled={!isDraft || !isDetailComplete}
                                    photos={acPhotos}
                                    onPhotosChange={(photos) => { setAcPhotos(photos as AcEntryPhotosWithIds[]); touch(); }}
                                    uploadFile={async (file, caption) => {
                                        const body = new FormData();
                                        body.append("photo", file);
                                        body.append("type", "before"); // type is handled by caption format ac_unit_{idx}
                                        body.append("caption", caption);
                                        const response = await fetch(`/work-reports/${workReport.id}/photos`, {
                                            method: "POST",
                                            headers: {
                                                Accept: "application/json",
                                                "X-CSRF-TOKEN": getCsrf(),
                                                "X-Requested-With": "XMLHttpRequest",
                                            },
                                            body,
                                        });
                                        if (!response.ok) {
                                            const data = (await response.json().catch(() => null)) as
                                                | { message?: string }
                                                | null;
                                            const message =
                                                data?.message ??
                                                (response.status === 422
                                                    ? 'Foto terlalu besar atau format tidak didukung (maks 2MB, JPG/PNG).'
                                                    : 'Gagal mengunggah foto.');
                                            toast.error(message);
                                            throw new Error(message);
                                        }
                                        return await response.json();
                                    }}
                                    deletePhoto={async (photo) => {
                                        await fetch(`/work-reports/${workReport.id}/photos/${photo.id}`, {
                                            method: "DELETE",
                                            headers: {
                                                Accept: "application/json",
                                                "X-CSRF-TOKEN": getCsrf(),
                                                "X-Requested-With": "XMLHttpRequest",
                                            },
                                        });
                                    }}
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
                            {isDraft && !isDetailComplete ? (
                                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                                    <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                            Lengkapi Detail Pekerjaan terlebih dahulu
                                        </p>
                                        <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                                            Isi semua data wajib (klien, kategori, deskripsi, dan area) sebelum mengunggah dokumentasi foto.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Foto Sebelum */}
                                    <div className="space-y-2">
                                        <Label>Foto Sebelum</Label>
                                        {isDraft ? (
                                            <DraftPhotoUpload
                                                                                        label="Upload foto sebelum"
                                                initialPhotos={(workReport.before_photos_data || []).map(toDraftPhoto)}
                                                onPhotosChange={(photos) =>
                                                    setExistingBeforePhotos(photos.map(toExistingPhoto))
                                                }
                                                uploadFile={async (file, caption) => {
                                                    const body = new FormData();
                                                    body.append('photo', file);
                                                    body.append('type', 'before');
                                                    body.append('caption', caption);

                                                    const response = await fetch(`/work-reports/${workReport.id}/photos`, {
                                                        method: 'POST',
                                                        headers: {
                                                            Accept: 'application/json',
                                                            'X-CSRF-TOKEN': getCsrf(),
                                                            'X-Requested-With': 'XMLHttpRequest',
                                                        },
                                                        body,
                                                    });

                                                    if (!response.ok) {
                                                        const data = (await response.json().catch(() => null)) as
                                                            | { message?: string }
                                                            | null;
                                                        const message =
                                                            data?.message ??
                                                            (response.status === 422
                                                                ? 'Foto terlalu besar atau format tidak didukung (maks 2MB, JPG/PNG).'
                                                                : 'Gagal mengunggah foto.');
                                                        toast.error(message);
                                                        throw new Error(message);
                                                    }

                                                    return (await response.json()) as DraftPhoto;
                                                }}
                                                deletePhoto={async (photo) => {
                                                    await fetch(`/work-reports/${workReport.id}/photos/${photo.id}`, {
                                                        method: 'DELETE',
                                                        headers: {
                                                            Accept: 'application/json',
                                                            'X-CSRF-TOKEN': getCsrf(),
                                                            'X-Requested-With': 'XMLHttpRequest',
                                                        },
                                                    });
                                                }}
                                            />
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Foto yang sudah ada:
                                            </p>
                                        )}
                                    </div>

                                    {/* Foto Sesudah */}
                                    <div className="space-y-2">
                                        <Label>Foto Sesudah <span className="text-destructive">*</span></Label>
                                        {isDraft ? (
                                            <DraftPhotoUpload
                                                                                        label="Upload foto sesudah"
                                                initialPhotos={(workReport.after_photos_data || []).map(toDraftPhoto)}
                                                onPhotosChange={(photos) =>
                                                    setExistingAfterPhotos(photos.map(toExistingPhoto))
                                                }
                                                uploadFile={async (file, caption) => {
                                                    const body = new FormData();
                                                    body.append('photo', file);
                                                    body.append('type', 'after');
                                                    body.append('caption', caption);

                                                    const response = await fetch(`/work-reports/${workReport.id}/photos`, {
                                                        method: 'POST',
                                                        headers: {
                                                            Accept: 'application/json',
                                                            'X-CSRF-TOKEN': getCsrf(),
                                                            'X-Requested-With': 'XMLHttpRequest',
                                                        },
                                                        body,
                                                    });

                                                    if (!response.ok) {
                                                        const data = (await response.json().catch(() => null)) as
                                                            | { message?: string }
                                                            | null;
                                                        const message =
                                                            data?.message ??
                                                            (response.status === 422
                                                                ? 'Foto terlalu besar atau format tidak didukung (maks 2MB, JPG/PNG).'
                                                                : 'Gagal mengunggah foto.');
                                                        toast.error(message);
                                                        throw new Error(message);
                                                    }

                                                    return (await response.json()) as DraftPhoto;
                                                }}
                                                deletePhoto={async (photo) => {
                                                    await fetch(`/work-reports/${workReport.id}/photos/${photo.id}`, {
                                                        method: 'DELETE',
                                                        headers: {
                                                            Accept: 'application/json',
                                                            'X-CSRF-TOKEN': getCsrf(),
                                                            'X-Requested-With': 'XMLHttpRequest',
                                                        },
                                                    });
                                                }}
                                            />
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                {existingAfterPhotos.map((photo) => (
                                                    <img
                                                        key={photo.id}
                                                        src={photo.photo_url}
                                                        alt={photo.caption || 'Foto'}
                                                        className="aspect-square w-full rounded-md border object-cover"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col items-stretch gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                        <Link href="/work-reports" className="w-full sm:w-auto">
                            <Button type="button" variant="ghost" className="w-full sm:w-auto">
                                Batal
                            </Button>
                        </Link>
                        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:items-center sm:gap-3">

                            <SaveStatusIndicator state={state} lastSavedAt={lastSavedAt} className="hidden sm:flex" />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                                disabled={processing || state === 'saving'}
                                onClick={(e) => void handleSaveDraft(e)}
                            >
                                <Save className="mr-2 size-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Draft'}
                            </Button>
                            <Button
                                type="button"
                                className="w-full sm:w-auto"
                                disabled={processing || state === 'saving'}
                                onClick={(e) => void handleSubmit(e)}
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
