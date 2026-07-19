import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhotoWithCaption {
    file: File;
    caption: string;
    previewUrl: string;
}

export interface ExistingPhoto {
    id: number;
    photo_path: string;
    caption: string | null;
    photo_url: string;
    sort_order: number;
}

interface FileUploadProps {
    label?: string;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    onChange: (files: File[]) => void;
    onPhotosChange?: (photos: PhotoWithCaption[]) => void;
    existingFiles?: string[];
    existingPhotos?: ExistingPhoto[];
    onRemoveExisting?: (path: string) => void;
    onRemoveExistingPhoto?: (id: number) => void;
    onUpdateExistingCaption?: (id: number, caption: string) => void;
    withCaption?: boolean;
    error?: string;
    className?: string;
}

export function FileUpload({
    label = 'Upload File',
    accept = 'image/jpeg,image/jpg,image/png',
    multiple = true,
    maxSize = 2,
    onChange,
    onPhotosChange,
    existingFiles = [],
    existingPhotos = [],
    onRemoveExisting,
    onRemoveExistingPhoto,
    onUpdateExistingCaption,
    withCaption = false,
    error,
    className,
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [previews, setPreviews] = useState<PhotoWithCaption[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList) return;

            const validFiles: File[] = [];

            Array.from(fileList).forEach((file) => {
                // Validate type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!validTypes.includes(file.type)) return;

                // Validate size
                if (file.size > maxSize * 1024 * 1024) return;

                validFiles.push(file);
            });

            if (validFiles.length > 0) {
                const newPhotos = validFiles.map((file) => ({
                    file,
                    caption: '',
                    previewUrl: URL.createObjectURL(file),
                }));

                const updated = [...previews, ...newPhotos];
                setPreviews(updated);

                if (withCaption && onPhotosChange) {
                    onPhotosChange(updated);
                } else {
                    onChange(updated.map((p) => p.file));
                }
            }
        },
        [maxSize, onChange, onPhotosChange, previews, withCaption]
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
            // Reset input value so the same file can be selected again
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [handleFiles]
    );

    const removePreview = (index: number) => {
        URL.revokeObjectURL(previews[index].previewUrl);
        const updated = previews.filter((_, i) => i !== index);
        setPreviews(updated);

        if (withCaption && onPhotosChange) {
            onPhotosChange(updated);
        } else {
            onChange(updated.map((p) => p.file));
        }
    };

    const updateCaption = (index: number, caption: string) => {
        const updated = previews.map((p, i) =>
            i === index ? { ...p, caption } : p
        );
        setPreviews(updated);

        if (withCaption && onPhotosChange) {
            onPhotosChange(updated);
        }
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Drag and Drop Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                    dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50',
                    error && 'border-destructive'
                )}
            >
                <Upload className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                    {label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Drag & drop atau klik untuk memilih. JPG/PNG, maks {maxSize}MB
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="sr-only"
                    aria-label={label}
                />
            </div>

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Existing Photos with caption support */}
            {existingPhotos.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        Foto yang sudah ada:
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {existingPhotos.map((photo) => (
                            <div
                                key={`existing-photo-${photo.id}`}
                                className="group relative overflow-hidden rounded-md border"
                            >
                                <div className="aspect-square">
                                    <img
                                        src={photo.photo_url}
                                        alt={photo.caption || 'Photo'}
                                        className="size-full object-cover"
                                    />
                                </div>
                                {withCaption && (
                                    <div className="p-2">
                                        <Input
                                            value={photo.caption || ''}
                                            onChange={(e) =>
                                                onUpdateExistingCaption?.(photo.id, e.target.value)
                                            }
                                            placeholder="Keterangan..."
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}
                                {onRemoveExistingPhoto && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-sm"
                                        className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveExistingPhoto(photo.id);
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

            {/* Legacy existing files (backward compat) */}
            {existingFiles.length > 0 && existingPhotos.length === 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        Foto yang sudah ada:
                    </p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {existingFiles.map((path, index) => (
                            <div
                                key={`existing-${index}`}
                                className="group relative aspect-square overflow-hidden rounded-md border"
                            >
                                <img
                                    src={`/storage/${path}`}
                                    alt={`Existing photo ${index + 1}`}
                                    className="size-full object-cover"
                                />
                                {onRemoveExisting && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-sm"
                                        className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveExisting(path);
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

            {/* New File Previews with Caption */}
            {previews.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        Foto baru:
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {previews.map((preview, index) => (
                            <div
                                key={`new-${index}`}
                                className="group relative overflow-hidden rounded-md border"
                            >
                                <div className="aspect-square">
                                    <img
                                        src={preview.previewUrl}
                                        alt={preview.caption || `New photo ${index + 1}`}
                                        className="size-full object-cover"
                                    />
                                </div>
                                {withCaption && (
                                    <div className="p-2">
                                        <Input
                                            value={preview.caption}
                                            onChange={(e) => updateCaption(index, e.target.value)}
                                            placeholder="Keterangan foto..."
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon-sm"
                                    className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removePreview(index);
                                    }}
                                >
                                    <X className="size-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
