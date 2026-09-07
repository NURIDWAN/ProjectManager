import { ChangeEvent, useRef, useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { Button } from '@/components/ui/button';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { PhotoCaptureModal, CapturedPhoto } from './PhotoCaptureModal';

export interface AcPhotoItem {
    file: File;
    previewUrl: string;
    caption: string;
}

export interface AcExistingPhoto {
    id: number;
    photo_url: string;
    caption: string | null;
}

export interface AcEntryPhotos {
    before: AcPhotoItem[];
    after: AcPhotoItem[];
    existingBefore: AcExistingPhoto[];
    existingAfter: AcExistingPhoto[];
}

export interface AcMeasurementEntry {
    lokasi: string;
    tipe_ac: 'Splitduct' | 'Cassette' | 'Splitwall' | '';
    merek: string;
    kapasitas: number | '';
    suhu_before: number | '';
    suhu_after: number | '';
    ampere_input_count: 1 | 2 | 3;
    ampere_before_r: number | '';
    ampere_before_s: number | '';
    ampere_before_t: number | '';
    ampere_after_r: number | '';
    ampere_after_s: number | '';
    ampere_after_t: number | '';
    freon_before: number | '';
    freon_after: number | '';
    keterangan: string;
}

export interface AcMeasurementFormProps {
    uploadFile?: (file: File, caption: string) => Promise<any>;
    deletePhoto?: (photo: any) => Promise<void>;
    entries: AcMeasurementEntry[];
    onChange: (entries: AcMeasurementEntry[]) => void;
    errors?: Record<string, string>;
    disabled?: boolean;
    photos?: AcEntryPhotos[];
    onPhotosChange?: (photos: AcEntryPhotos[]) => void;
}

export const EMPTY_ENTRY: AcMeasurementEntry = {
    lokasi: '',
    tipe_ac: '',
    merek: '',
    kapasitas: '',
    suhu_before: '',
    suhu_after: '',
    ampere_input_count: 1,
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

const firstMeasurement = (...values: unknown[]): number | '' => {
    const value = values.find((candidate) => candidate !== '' && candidate !== null && candidate !== undefined);
    return typeof value === 'number' ? value : '';
};

export const normalizeAcMeasurementEntry = (raw: Record<string, unknown>): AcMeasurementEntry => {
    const highestUsedPhase = (['t', 's', 'r'] as const).find((phase) =>
        [`ampere_before_${phase}`, `ampere_after_${phase}`].some((key) =>
            raw[key] !== '' && raw[key] !== null && raw[key] !== undefined
        )
    );
    const inferredCount = highestUsedPhase === 't' ? 3 : highestUsedPhase === 's' ? 2 : 1;
    const requestedCount = Number(raw.ampere_input_count);
    const ampereInputCount = ([1, 2, 3].includes(requestedCount) ? requestedCount : inferredCount) as 1 | 2 | 3;

    return {
        ...EMPTY_ENTRY,
        ...raw,
        suhu_before: firstMeasurement(raw.suhu_before, raw.suhu_before_r, raw.suhu_before_s, raw.suhu_before_t),
        suhu_after: firstMeasurement(raw.suhu_after, raw.suhu_after_r, raw.suhu_after_s, raw.suhu_after_t),
        ampere_input_count: ampereInputCount,
    } as AcMeasurementEntry;
};

const TIPE_AC_OPTIONS = ['Splitduct', 'Cassette', 'Splitwall'] as const;
const MEREK_OPTIONS = ['Panasonic', 'Gree', 'Daikin'] as const;

const MIN_ENTRIES = 1;
const MAX_ENTRIES = 50;

export const EMPTY_PHOTOS: AcEntryPhotos = {
    before: [],
    after: [],
    existingBefore: [],
    existingAfter: [],
};

export default function AcMeasurementForm({
    uploadFile,
    deletePhoto,
    entries,
    onChange,
    errors = {},
    disabled = false,
    photos = [],
    onPhotosChange,
}: AcMeasurementFormProps) {
    const handleUploadedPhoto = (entryIndex: number, type: 'before' | 'after', uploadedPhoto: any) => {
        if (!onPhotosChange) return;
        const updatedPhotos = [...photos];
        while (updatedPhotos.length <= entryIndex) {
            updatedPhotos.push({ ...EMPTY_PHOTOS });
        }
        const key = type === 'before' ? 'existingBefore' : 'existingAfter';
        updatedPhotos[entryIndex] = {
            ...updatedPhotos[entryIndex],
            [key]: [...updatedPhotos[entryIndex][key], { 
                id: uploadedPhoto.id, 
                photo_url: uploadedPhoto.photo_url, 
                caption: uploadedPhoto.caption || null 
            }],
        };
        onPhotosChange(updatedPhotos);
    };

    const updateEntry = (index: number, field: keyof AcMeasurementEntry, value: string | number) => {
        const updated = [...entries];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const updateAmpereInputCount = (index: number, value: string) => {
        const count = Number(value) as 1 | 2 | 3;
        const updated = [...entries];
        const entry = { ...updated[index], ampere_input_count: count };

        if (count < 3) {
            entry.ampere_before_t = '';
            entry.ampere_after_t = '';
        }
        if (count < 2) {
            entry.ampere_before_s = '';
            entry.ampere_after_s = '';
        }

        updated[index] = entry;
        onChange(updated);
    };

    const handleTextChange = (index: number, field: keyof AcMeasurementEntry) => (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        updateEntry(index, field, e.target.value);
    };

    const handleNumericChange = (index: number, field: keyof AcMeasurementEntry) => (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const val = e.target.value;
        updateEntry(index, field, val === '' ? '' : parseFloat(val));
    };

    const addEntry = () => {
        if (entries.length < MAX_ENTRIES) {
            onChange([...entries, { ...EMPTY_ENTRY }]);
            if (onPhotosChange) {
                onPhotosChange([...photos, { ...EMPTY_PHOTOS }]);
            }
        }
    };

    const removeEntry = (index: number) => {
        if (entries.length > MIN_ENTRIES) {
            const updated = entries.filter((_, i) => i !== index);
            onChange(updated);
            if (onPhotosChange) {
                const updatedPhotos = photos.filter((_, i) => i !== index);
                onPhotosChange(updatedPhotos);
            }
        }
    };

    const handlePhotoUpload = (entryIndex: number, type: 'before' | 'after', files: FileList | null) => {
        if (!files || !onPhotosChange) return;
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const newItems: AcPhotoItem[] = [];
        Array.from(files).forEach((file) => {
            if (validTypes.includes(file.type) && file.size <= 2 * 1024 * 1024) {
                newItems.push({ file, previewUrl: URL.createObjectURL(file), caption: '' });
            }
        });
        if (newItems.length === 0) return;

        const updatedPhotos = [...photos];
        while (updatedPhotos.length <= entryIndex) {
            updatedPhotos.push({ ...EMPTY_PHOTOS });
        }
        updatedPhotos[entryIndex] = {
            ...updatedPhotos[entryIndex],
            [type]: [...updatedPhotos[entryIndex][type], ...newItems],
        };
        onPhotosChange(updatedPhotos);
    };

    const removePhoto = (entryIndex: number, type: 'before' | 'after', photoIndex: number) => {
        if (!onPhotosChange) return;
        const updatedPhotos = [...photos];
        const list = [...updatedPhotos[entryIndex][type]];
        URL.revokeObjectURL(list[photoIndex].previewUrl);
        list.splice(photoIndex, 1);
        updatedPhotos[entryIndex] = { ...updatedPhotos[entryIndex], [type]: list };
        onPhotosChange(updatedPhotos);
    };

    const removeExistingPhoto = (entryIndex: number, type: 'before' | 'after', photoId: number) => {
        if (!onPhotosChange) return;
        const updatedPhotos = [...photos];
        const key = type === 'before' ? 'existingBefore' : 'existingAfter';
        updatedPhotos[entryIndex] = {
            ...updatedPhotos[entryIndex],
            [key]: updatedPhotos[entryIndex][key].filter((p) => p.id !== photoId),
        };
        onPhotosChange(updatedPhotos);
    };

    const updatePhotoCaption = (entryIndex: number, type: 'before' | 'after', photoIndex: number, caption: string) => {
        if (!onPhotosChange) return;
        const updatedPhotos = [...photos];
        const list = [...updatedPhotos[entryIndex][type]];
        list[photoIndex] = { ...list[photoIndex], caption };
        updatedPhotos[entryIndex] = { ...updatedPhotos[entryIndex], [type]: list };
        onPhotosChange(updatedPhotos);
    };

    const getError = (index: number, field: string): string | undefined => {
        return errors[`entries.${index}.${field}`];
    };

    const inputClassName =
        'h-11 w-full min-w-0 rounded-md border-input bg-background px-3 text-base shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted sm:h-10 sm:text-sm';

    const selectClassName =
        'h-11 w-full min-w-0 rounded-md border-input bg-background px-3 text-base shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted sm:h-10 sm:text-sm';

    return (
        <div className="min-w-0 space-y-6">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                    Data Pengukuran AC
                </h3>
                {!disabled && (
                    <button
                        type="button"
                        onClick={addEntry}
                        disabled={entries.length >= MAX_ENTRIES}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs outline-none transition-[color,background-color,box-shadow,transform] hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-px disabled:opacity-50 sm:w-auto"
                    >
                        + Tambah Unit AC
                    </button>
                )}
            </div>

            {entries.map((entry, index) => (
                <div
                    key={index}
                    className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-4"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">
                            Unit AC #{index + 1}
                        </h4>
                        {!disabled && entries.length > MIN_ENTRIES && (
                            <button
                                type="button"
                                onClick={() => removeEntry(index)}
                                className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-600 transition duration-150 ease-in-out hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Hapus
                            </button>
                        )}
                    </div>

                    {/* Unit Identification Fields */}
                    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <InputLabel value="Lokasi" />
                            <input
                                type="text"
                                value={entry.lokasi}
                                onChange={handleTextChange(index, 'lokasi')}
                                disabled={disabled}
                                className={inputClassName}
                                placeholder="Contoh: Lantai 1 - Ruang Meeting"
                                maxLength={255}
                            />
                            <InputError message={getError(index, 'lokasi')} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Tipe AC" />
                            <select
                                value={entry.tipe_ac}
                                onChange={handleTextChange(index, 'tipe_ac')}
                                disabled={disabled}
                                className={selectClassName}
                            >
                                <option value="">Pilih Tipe AC</option>
                                {TIPE_AC_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            <InputError message={getError(index, 'tipe_ac')} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Merek" />
                            <MerekSelect
                                value={entry.merek}
                                onChange={(val) => updateEntry(index, 'merek', val)}
                                disabled={disabled}
                                className={selectClassName}
                                inputClassName={inputClassName}
                            />
                            <InputError message={getError(index, 'merek')} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Kapasitas (PK)" />
                            <input
                                type="number"
                                value={entry.kapasitas}
                                onChange={handleNumericChange(index, 'kapasitas')}
                                disabled={disabled}
                                className={inputClassName}
                                placeholder="PK"
                                min={0.5}
                                max={30}
                                step={0.5}
                            />
                            <InputError message={getError(index, 'kapasitas')} className="mt-1" />
                        </div>
                    </div>

                    {/* Suhu Fields */}
                    <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-600">
                            Suhu (°C)
                        </h5>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">Before (Opsional)</p>
                                <input
                                    type="number"
                                    value={entry.suhu_before}
                                    onChange={handleNumericChange(index, 'suhu_before')}
                                    disabled={disabled}
                                    className={inputClassName}
                                    placeholder="°C"
                                    min={-10}
                                    max={100}
                                    step={0.1}
                                />
                                <InputError message={getError(index, 'suhu_before')} className="mt-1" />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">After (Opsional)</p>
                                <input
                                    type="number"
                                    value={entry.suhu_after}
                                    onChange={handleNumericChange(index, 'suhu_after')}
                                    disabled={disabled}
                                    className={inputClassName}
                                    placeholder="°C"
                                    min={-10}
                                    max={100}
                                    step={0.1}
                                />
                                <InputError message={getError(index, 'suhu_after')} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Ampere Fields */}
                    <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-600">
                            Ampere (A)
                        </h5>
                        <div className="mb-3 max-w-xs">
                            <InputLabel value="Jumlah Input Ampere" />
                            <select
                                value={entry.ampere_input_count}
                                onChange={(event) => updateAmpereInputCount(index, event.target.value)}
                                disabled={disabled}
                                className={selectClassName}
                            >
                                <option value={1}>1 input (R)</option>
                                <option value={2}>2 input (R, S)</option>
                                <option value={3}>3 input (R, S, T)</option>
                            </select>
                            <InputError message={getError(index, 'ampere_input_count')} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">Before</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['ampere_before_r', 'ampere_before_s', 'ampere_before_t'] as const)
                                        .slice(0, entry.ampere_input_count)
                                        .map(
                                        (field) => (
                                            <div key={field}>
                                                <input
                                                    type="number"
                                                    value={entry[field]}
                                                    onChange={handleNumericChange(index, field)}
                                                    disabled={disabled}
                                                    className={inputClassName}
                                                    placeholder={field.slice(-1).toUpperCase()}
                                                    min={0}
                                                    max={200}
                                                    step={0.1}
                                                />
                                                <InputError
                                                    message={getError(index, field)}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">After</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['ampere_after_r', 'ampere_after_s', 'ampere_after_t'] as const)
                                        .slice(0, entry.ampere_input_count)
                                        .map(
                                        (field) => (
                                            <div key={field}>
                                                <input
                                                    type="number"
                                                    value={entry[field]}
                                                    onChange={handleNumericChange(index, field)}
                                                    disabled={disabled}
                                                    className={inputClassName}
                                                    placeholder={field.slice(-1).toUpperCase()}
                                                    min={0}
                                                    max={200}
                                                    step={0.1}
                                                />
                                                <InputError
                                                    message={getError(index, field)}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Freon Fields */}
                    <div className="mb-4">
                        <h5 className="mb-2 text-sm font-medium text-gray-600">
                            Tekanan Freon (PSI)
                        </h5>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">Before (Opsional)</p>
                                <input
                                    type="number"
                                    value={entry.freon_before}
                                    onChange={handleNumericChange(index, 'freon_before')}
                                    disabled={disabled}
                                    className={inputClassName}
                                    placeholder="PSI"
                                    min={0}
                                    max={800}
                                    step={1}
                                />
                                <InputError
                                    message={getError(index, 'freon_before')}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500">After (Opsional)</p>
                                <input
                                    type="number"
                                    value={entry.freon_after}
                                    onChange={handleNumericChange(index, 'freon_after')}
                                    disabled={disabled}
                                    className={inputClassName}
                                    placeholder="PSI"
                                    min={0}
                                    max={800}
                                    step={1}
                                />
                                <InputError
                                    message={getError(index, 'freon_after')}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div>
                        <InputLabel value="Keterangan" />
                        <textarea
                            value={entry.keterangan}
                            onChange={handleTextChange(index, 'keterangan')}
                            disabled={disabled}
                            className={inputClassName}
                            rows={2}
                            placeholder="Catatan tambahan (opsional)"
                            maxLength={1000}
                        />
                        <InputError message={getError(index, 'keterangan')} className="mt-1" />
                    </div>

                    {/* Dokumentasi Foto per Unit */}
                    {!disabled && onPhotosChange && (
                        <div className="mt-4 border-t pt-4">
                            <h5 className="mb-3 text-sm font-medium text-gray-600">
                                Dokumentasi Foto
                            </h5>
                            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
                                {/* Foto Before */}
                                <div className="min-w-0">
                                    <p className="mb-2 text-xs font-medium text-gray-500">Foto Sebelum</p>
                                    <PhotoUploadArea
                                        entryIndex={index}
                                        type="before"
                                        photos={photos[index]?.before ?? []}
                                        existingPhotos={photos[index]?.existingBefore ?? []}
                                        onUpload={handlePhotoUpload}
                                        onRemove={removePhoto}
                                        onRemoveExisting={removeExistingPhoto}
                                        onCaptionChange={updatePhotoCaption}
                                        uploadFile={uploadFile}
                                        deletePhoto={deletePhoto}
                                        onAddExisting={(p) => handleUploadedPhoto(index, 'before', p)}
                                    />
                                </div>
                                {/* Foto After */}
                                <div className="min-w-0">
                                    <p className="mb-2 text-xs font-medium text-gray-500">Foto Sesudah</p>
                                    <PhotoUploadArea
                                        entryIndex={index}
                                        type="after"
                                        photos={photos[index]?.after ?? []}
                                        existingPhotos={photos[index]?.existingAfter ?? []}
                                        onUpload={handlePhotoUpload}
                                        onRemove={removePhoto}
                                        onRemoveExisting={removeExistingPhoto}
                                        onCaptionChange={updatePhotoCaption}
                                        uploadFile={uploadFile}
                                        deletePhoto={deletePhoto}
                                        onAddExisting={(p) => handleUploadedPhoto(index, 'after', p)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show existing photos in disabled/view mode */}
                    {disabled && photos[index] && (
                        (photos[index].existingBefore.length > 0 || photos[index].existingAfter.length > 0) && (
                            <div className="mt-4 border-t pt-4">
                                <h5 className="mb-3 text-sm font-medium text-gray-600">
                                    Dokumentasi Foto
                                </h5>
                                <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
                                    {photos[index].existingBefore.length > 0 && (
                                        <div className="min-w-0">
                                            <p className="mb-2 text-xs font-medium text-gray-500">Foto Sebelum</p>
                                            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 md:grid-cols-3">
                                                {photos[index].existingBefore.map((photo) => (
                                                    <div key={photo.id} className="aspect-square overflow-hidden rounded-md border">
                                                        <img src={photo.photo_url} alt="Before" className="size-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {photos[index].existingAfter.length > 0 && (
                                        <div className="min-w-0">
                                            <p className="mb-2 text-xs font-medium text-gray-500">Foto Sesudah</p>
                                            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 md:grid-cols-3">
                                                {photos[index].existingAfter.map((photo) => (
                                                    <div key={photo.id} className="aspect-square overflow-hidden rounded-md border">
                                                        <img src={photo.photo_url} alt="After" className="size-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            ))}

            {!disabled && entries.length < MAX_ENTRIES && (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={addEntry}
                        className="inline-flex min-h-10 items-center rounded-md border border-dashed border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground outline-none hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                        + Tambah Unit AC ({entries.length}/{MAX_ENTRIES})
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * MerekSelect - A select with a custom text input option.
 * Shows predefined options (Panasonic, Gree, Daikin) plus "Lainnya" for custom input.
 */
function MerekSelect({
    value,
    onChange,
    disabled,
    className,
    inputClassName,
}: {
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    className: string;
    inputClassName: string;
}) {
    const isCustom = value !== '' && !MEREK_OPTIONS.includes(value as typeof MEREK_OPTIONS[number]);

    if (isCustom) {
        return (
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value.trim() === '' ? '' : value}
                    onChange={(e) => onChange(e.target.value || ' ')}
                    disabled={disabled}
                    className={inputClassName}
                    placeholder="Masukkan merek"
                    maxLength={100}
                />
                <button
                    type="button"
                    onClick={() => onChange('')}
                    disabled={disabled}
                    className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-25"
                    title="Kembali ke pilihan"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <select
            value={value}
            onChange={(e) => {
                if (e.target.value === '__custom__') {
                    // Set to space to trigger custom input mode
                    onChange(' ');
                } else {
                    onChange(e.target.value);
                }
            }}
            disabled={disabled}
            className={className}
        >
            <option value="">Pilih Merek</option>
            {MEREK_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
            <option value="__custom__">Lainnya...</option>
        </select>
    );
}

/**
 * PhotoUploadArea - Inline photo upload for each AC unit entry with captions.
 */
function PhotoUploadArea({
    entryIndex,
    type,
    photos,
    existingPhotos,
    onUpload,
    onRemove,
    onRemoveExisting,
    onCaptionChange,
    uploadFile,
    deletePhoto,
    onAddExisting,
}: {
    entryIndex: number;
    type: 'before' | 'after';
    photos: AcPhotoItem[];
    existingPhotos: AcExistingPhoto[];
    onUpload: (entryIndex: number, type: 'before' | 'after', files: FileList | null) => void;
    onRemove: (entryIndex: number, type: 'before' | 'after', photoIndex: number) => void;
    onRemoveExisting: (entryIndex: number, type: 'before' | 'after', photoId: number) => void;
    onCaptionChange: (entryIndex: number, type: 'before' | 'after', photoIndex: number, caption: string) => void;
    uploadFile?: (file: File, caption: string) => Promise<any>;
    deletePhoto?: (photo: any) => Promise<void>;
    onAddExisting?: (photo: any) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [modalOpen, setModalOpen] = useState(false);
    
    // Combine existing photos and in-flight photos for the modal view
    const allExistingForModal = [
        ...existingPhotos.map(p => ({ id: p.id, photo_url: p.photo_url, caption: p.caption || '' })),
        ...photos.map((p, i) => ({ id: -Date.now() - i, photo_url: p.previewUrl, caption: p.caption, file: p.file }))
    ] as CapturedPhoto[];

    return (
        <div className="min-w-0 space-y-3">
            {/* Existing photos (uploaded to server) */}
            {existingPhotos.length > 0 && (
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 md:grid-cols-3">
                    {existingPhotos.map((photo) => (
                        <div key={photo.id} className="relative min-w-0 overflow-hidden rounded-md border">
                            <div className="aspect-square">
                                <img src={photo.photo_url} alt="" className="size-full object-cover" />
                            </div>
                            {photo.caption && (
                                <div className="border-t bg-gray-50 px-2 py-1">
                                    <p className="break-words text-center text-xs text-gray-600">{photo.caption}</p>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemoveExisting(entryIndex, type, photo.id)}
                                className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:size-7"
                                aria-label="Hapus foto tersimpan"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Offline/In-flight photos (not uploaded yet) */}
            {photos.length > 0 && (
                <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 md:grid-cols-3">
                    {photos.map((photo, idx) => (
                        <div key={idx} className="relative min-w-0 overflow-hidden rounded-md border">
                            <div className="aspect-square">
                                <img src={photo.previewUrl} alt="" className="size-full object-cover" />
                            </div>
                            <div className="border-t p-1.5">
                                <input
                                    type="text"
                                    value={photo.caption}
                                    onChange={(e) => onCaptionChange(entryIndex, type, idx, e.target.value)}
                                    placeholder="Keterangan foto..."
                                    className="w-full min-w-0 rounded-md border-input bg-background px-2 py-2 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 sm:py-1 sm:text-xs"
                                    maxLength={255}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemove(entryIndex, type, idx)}
                                className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:size-7"
                                aria-label="Hapus foto baru"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload & Camera actions */}
            <div className="flex gap-2">
                {uploadFile && (
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)} // this is replaced below manually
                        className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                        <Camera className="mr-2 size-5 shrink-0" />
                        <span className="text-sm font-medium">Ambil Foto/Upload</span>
                    </button>
                )}
                {!uploadFile && (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md border border-dashed border-input bg-background px-3 text-muted-foreground outline-none hover:border-primary/45 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                        <Upload className="mr-2 size-5 shrink-0" />
                        <span className="text-sm font-medium">Upload File</span>
                    </button>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                onChange={(e) => {
                    onUpload(entryIndex, type, e.target.files);
                    e.target.value = '';
                }}
                className="sr-only"
            />
            
            {uploadFile && (
                <PhotoCaptureModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    photoType={type}
                    unitIndex={entryIndex}
                    uploadFile={uploadFile}
                    deletePhoto={async (p) => {
                        if (deletePhoto && p.id > 0) {
                            await deletePhoto(p);
                            onRemoveExisting(entryIndex, type, p.id);
                        } else {
                            const idx = photos.findIndex(ph => ph.previewUrl === p.photo_url);
                            if (idx >= 0) onRemove(entryIndex, type, idx);
                        }
                    }}
                    onPhotoAdded={(p) => onAddExisting && onAddExisting(p)}
                    existingPhotos={allExistingForModal}
                    onPhotosChange={() => {}}
                />
            )}
        </div>
    );
}
