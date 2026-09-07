import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhotoCaptureModal, CapturedPhoto } from './PhotoCaptureModal';

export interface DraftPhoto {
    id: number;
    photo_url: string;
    caption: string;
    uploading?: boolean;
}

interface DraftPhotoUploadProps {
    label?: string;
    /** Called whenever the photo list changes (upload finished, removed, caption edited). */
    onPhotosChange: (photos: DraftPhoto[]) => void;
    /** Uploads one file; must throw on failure. */
    uploadFile: (file: File, caption: string) => Promise<DraftPhoto>;
    /** Deletes one uploaded photo; must throw on failure. */
    deletePhoto: (photo: DraftPhoto) => Promise<void>;
    /** Type of photo: 'before' or 'after' */
    photoType?: 'before' | 'after';
    /** Unit index for AC photos (null for non-AC) */
    unitIndex?: number | null;
    /** Photos already persisted on the server, shown on first render (Edit page). */
    initialPhotos?: DraftPhoto[];
    error?: string;
    className?: string;
}

const MAX_SIZE_MB = 2;
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Photo uploader that persists each file to the server immediately.
 * Used by the autosave-enabled work report forms so photos survive
 * reloads and technician handovers.
 */
export function DraftPhotoUpload({
    label = 'Upload Foto',
    onPhotosChange,
    uploadFile,
    deletePhoto,
    photoType = 'before',
    unitIndex = null,
    initialPhotos = [],
    error,
    className,
}: DraftPhotoUploadProps) {
    const [photos, setPhotos] = useState<DraftPhoto[]>(initialPhotos);
    const [modalOpen, setModalOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const updateList = useCallback(
        (next: DraftPhoto[] | ((prev: DraftPhoto[]) => DraftPhoto[])) => {
            setPhotos((current) => {
                const resolved = typeof next === 'function' ? next(current) : next;
                onPhotosChange(resolved);
                return resolved;
            });
        },
        [onPhotosChange],
    );

    // Handle photo added from modal
    const handlePhotoAdded = useCallback(
        (photo: CapturedPhoto) => {
            updateList((prev) => [...prev, photo as DraftPhoto]);
        },
        [updateList],
    );

    // Handle photos change from modal
    const handlePhotosChange = useCallback(
        (newPhotos: CapturedPhoto[]) => {
            updateList(newPhotos as DraftPhoto[]);
        },
        [updateList],
    );

    const handleFiles = useCallback(
        async (fileList: FileList | null) => {
            if (!fileList) return;

            const validFiles = Array.from(fileList).filter(
                (file) => VALID_TYPES.includes(file.type) && file.size <= MAX_SIZE_MB * 1024 * 1024,
            );

            for (const file of validFiles) {
                // Optimistic placeholder while uploading
                const placeholder: DraftPhoto = {
                    id: -Date.now() - Math.floor(Math.random() * 1000),
                    photo_url: URL.createObjectURL(file),
                    caption: '',
                    uploading: true,
                };
                updateList((prev) => [...prev, placeholder]);

                try {
                    const uploaded = await uploadFile(file, '');
                    updateList((prev) =>
                        prev.map((p) => (p.id === placeholder.id ? uploaded : p)),
                    );
                } catch {
                    updateList((prev) => prev.filter((p) => p.id !== placeholder.id));
                    URL.revokeObjectURL(placeholder.photo_url);
                }
            }

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [updateList, uploadFile],
    );

    const removePhoto = useCallback(
        async (photo: DraftPhoto) => {
            updateList((prev) => prev.filter((p) => p.id !== photo.id));

            try {
                await deletePhoto(photo);
            } catch {
                // Photo row stays on the server; it will be cleaned up on submit.
            }

            if (photo.uploading) {
                URL.revokeObjectURL(photo.photo_url);
            }
        },
        [deletePhoto, updateList],
    );

    const updateCaption = (id: number, caption: string) => {
        updateList((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Single Review Foto button */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setModalOpen(true)}
            >
                <Camera className="mr-2 size-4" />
                Review Foto
            </Button>

            {/* Hidden file input for manual upload fallback */}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                onChange={(e) => void handleFiles(e.target.files)}
                className="sr-only"
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            {photos.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Foto terunggah:</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="group relative overflow-hidden rounded-md border"
                            >
                                <div className="relative aspect-square">
                                    <img
                                        src={photo.photo_url}
                                        alt={photo.caption || 'Foto'}
                                        className={cn(
                                            'size-full object-cover transition-opacity',
                                            photo.uploading && 'opacity-50',
                                        )}
                                    />
                                    {photo.uploading && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="size-6 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-2">
                                    <Input
                                        value={photo.caption}
                                        onChange={(e) => updateCaption(photo.id, e.target.value)}
                                        placeholder="Keterangan foto..."
                                        className="h-8 text-xs"
                                        disabled={photo.uploading}
                                    />
                                </div>
                                {!photo.uploading && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-sm"
                                        className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void removePhoto(photo);
                                        }}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Photo Capture Modal */}
            <PhotoCaptureModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                photoType={photoType}
                unitIndex={unitIndex}
                uploadFile={uploadFile}
                deletePhoto={deletePhoto}
                onPhotoAdded={handlePhotoAdded}
                existingPhotos={photos as CapturedPhoto[]}
                onPhotosChange={handlePhotosChange}
            />
        </div>
    );
}
