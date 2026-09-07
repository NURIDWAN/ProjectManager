import { useCallback, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { DraftPhotoUpload, DraftPhoto } from '@/Components/DraftPhotoUpload';
import AcMeasurementForm, {
    AcMeasurementEntry,
    AcEntryPhotos,
    EMPTY_ENTRY,
    EMPTY_PHOTOS,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, ClipboardList, Camera, UserRoundCog, TriangleAlert } from 'lucide-react';
import { useWorkReportAutosave } from '@/hooks/useWorkReportAutosave';

interface Props {
    clients: { id: number; name: string }[];
    categories: { id: number; name: string; preset_identifier: string | null }[];
    technicians: { id: number; name: string }[];
}

export default function Create({ clients, categories, technicians }: Props) {
    const [clientId, setClientId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [area, setArea] = useState('');
    const [beforePhotos, setBeforePhotos] = useState<DraftPhoto[]>([]);
    const [afterPhotos, setAfterPhotos] = useState<DraftPhoto[]>([]);
    const [presetData, setPresetData] = useState<AcMeasurementEntry[]>([]);
    const [acPhotos, setAcPhotos] = useState<AcEntryPhotos[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const reportIdRef = useRef<number | null>(null);

    const selectedCategory = categories.find((c) => String(c.id) === categoryId);
    const isAcCategory = selectedCategory?.preset_identifier === 'ac_maintenance';

    // Detail Pekerjaan harus lengkap sebelum dokumentasi bisa diakses
    const isDetailComplete = Boolean(clientId && categoryId && description.trim() && area.trim());

    // === Autosave wiring ===

    const handleDraftCreated = (id: number) => {
        reportIdRef.current = id;
    };

    const buildAutosavePayload = useCallback((): Record<string, unknown> | false => {
        const hasAnyData =
            clientId || categoryId || description.trim() || area || presetData.length > 0;
        if (!hasAnyData) {
            return false; // don't create empty drafts
        }

        return {
            client_id: clientId || null,
            category_id: categoryId || null,
            description: description || null,
            area: area || null,
            preset_data: isAcCategory && presetData.length > 0 ? JSON.stringify(presetData) : null,
            photo_captions: Object.fromEntries(
                [...beforePhotos, ...afterPhotos]
                    .filter((p) => p.id > 0 && p.caption !== '')
                    .map((p) => [p.id, p.caption]),
            ),
        };
    }, [clientId, categoryId, description, area, presetData, isAcCategory, beforePhotos, afterPhotos]);

    const { state, lastSavedAt, markDirty, flush, reset } = useWorkReportAutosave({
        buildPayload: buildAutosavePayload,
        onDraftCreated: handleDraftCreated,
        onError: (message) => toast.error(message),
    });

    const touch = () => markDirty();

    // === Draft photo upload helpers ===

    const getCsrf = () =>
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const uploadDraftPhoto = useCallback(
        async (file: File, caption: string): Promise<DraftPhoto> => {
            const body = new FormData();
            body.append('photo', file);
            body.append('type', 'before');
            body.append('caption', caption);

            const response = await fetch(`/work-reports/${reportIdRef.current}/photos`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                toast.error(
                    (data as { message?: string } | null)?.message ?? 'Gagal mengunggah foto.',
                );
                throw new Error('upload failed');
            }

            return (await response.json()) as DraftPhoto;
        },
        [],
    );

    const deleteDraftPhoto = useCallback(async (photo: DraftPhoto) => {
        if (photo.id <= 0) return;

        await fetch(`/work-reports/${reportIdRef.current}/photos/${photo.id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': getCsrf(),
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    }, []);

    // Ensures the draft exists before a photo can be attached to it.
    const ensureDraftThenUpload = useCallback(
        async (file: File, caption: string): Promise<DraftPhoto> => {
            if (reportIdRef.current === null) {
                const ok = await flush();
                if (!ok || reportIdRef.current === null) {
                    toast.error('Tunggu draft tersimpan sebelum mengunggah foto.');
                    throw new Error('no draft');
                }
            }

            return uploadDraftPhoto(file, caption);
        },
        [flush, uploadDraftPhoto],
    );

    // === Category change ===

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
        if (willBeAcCategory && !wasAcCategory && presetData.length === 0) {
            setPresetData([{ ...EMPTY_ENTRY }]);
            setAcPhotos([{ ...EMPTY_PHOTOS }]);
        }
        touch();
    };

    // === Manual save / submit ===

    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Persist everything (including photos already uploaded) via autosave
        const saved = await flush();
        if (saved) {
            toast.success('Draft laporan kerja tersimpan.');
            reset();
            router.visit('/work-reports');
        } else {
            setProcessing(false);
            toast.error('Gagal menyimpan draft. Periksa koneksi Anda.');
        }
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
        // AC category uses per-unit photos, so skip global after_photos requirement
        if (!isAcCategory && afterPhotos.filter((p) => p.id > 0).length === 0) {
            validationErrors.after_photos = 'Minimal satu foto sesudah harus di-upload.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error('Lengkapi data yang diperlukan sebelum submit.');
            setProcessing(false);
            return;
        }

        // Save first, then submit (report may not exist yet)
        const saved = await flush();
        if (!saved || reportIdRef.current === null) {
            toast.error('Gagal menyiapkan laporan. Coba lagi.');
            setProcessing(false);
            return;
        }

        router.post(`/work-reports/${reportIdRef.current}/submit`, {}, {
            onSuccess: () => {
                toast.success('Laporan kerja berhasil disubmit.');
            },
            onError: (errs) => {
                const errorMsg = Object.values(errs).flat().join(', ');
                toast.error(errorMsg || 'Gagal submit laporan kerja.');
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
                                <SaveStatusIndicator state={state} lastSavedAt={lastSavedAt} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Klien */}
                            <div className="space-y-2">
                                <Label htmlFor="client_id">Klien <span className="text-destructive">*</span></Label>
                                <Select value={clientId} onValueChange={(v) => { setClientId(v ?? ''); touch(); }} items={Object.fromEntries(clients.map(c => [String(c.id), c.name]))}>
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
                                    onChange={(e) => { setArea(e.target.value); touch(); }}
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
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="size-5 text-muted-foreground" />
                                    <div>
                                        <CardTitle className="text-base">Data Pengukuran AC</CardTitle>
                                        <CardDescription>
                                            Input data pengukuran teknis unit AC
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-3 sm:px-6">
                                {!isDetailComplete && (
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
                                    disabled={!isDetailComplete}
                                    photos={acPhotos as unknown as AcEntryPhotos[]}
                                    onPhotosChange={(photos) => { setAcPhotos(photos as unknown as AcEntryPhotos[]); touch(); }}
                                    uploadFile={ensureDraftThenUpload}
                                    deletePhoto={deleteDraftPhoto}
                                />
                            </CardContent>
                        </Card>
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
                                        Upload foto sebelum dan sesudah pekerjaan dengan keterangan.
                                        Foto langsung tersimpan saat dipilih.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isDetailComplete ? (
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
                                        <DraftPhotoUpload
                                            label="Upload foto sebelum"
                                            onPhotosChange={setBeforePhotos}
                                            uploadFile={ensureDraftThenUpload}
                                            deletePhoto={deleteDraftPhoto}
                                            error={errors.before_photos}
                                        />
                                    </div>

                                    {/* Foto Sesudah */}
                                    <div className="space-y-2">
                                        <Label>Foto Sesudah <span className="text-destructive">*</span></Label>
                                        <DraftPhotoUpload
                                            label="Upload foto sesudah"
                                            onPhotosChange={setAfterPhotos}
                                            uploadFile={(file, caption) =>
                                                ensureDraftThenUpload(file, caption).then((photo) => ({ ...photo, type: 'after' as const }))
                                            }
                                            deletePhoto={deleteDraftPhoto}
                                            error={errors.after_photos}
                                        />
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

                            <SaveStatusIndicator state={state} lastSavedAt={lastSavedAt} className="sm:hidden" />
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

        </AuthenticatedLayout>
    );
}
