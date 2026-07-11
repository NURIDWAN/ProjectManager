import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    label?: string;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    onChange: (files: File[]) => void;
    existingFiles?: string[];
    onRemoveExisting?: (path: string) => void;
    error?: string;
    className?: string;
}

export function FileUpload({
    label = 'Upload File',
    accept = 'image/jpeg,image/jpg,image/png',
    multiple = true,
    maxSize = 2,
    onChange,
    existingFiles = [],
    onRemoveExisting,
    error,
    className,
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
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
                const newPreviews = validFiles.map((file) => ({
                    file,
                    url: URL.createObjectURL(file),
                }));

                setPreviews((prev) => [...prev, ...newPreviews]);
                onChange([
                    ...previews.map((p) => p.file),
                    ...validFiles,
                ]);
            }
        },
        [maxSize, onChange, previews]
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
        const updated = previews.filter((_, i) => i !== index);
        // Revoke old URL
        URL.revokeObjectURL(previews[index].url);
        setPreviews(updated);
        onChange(updated.map((p) => p.file));
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

            {/* Existing File Previews */}
            {existingFiles.length > 0 && (
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

            {/* New File Previews */}
            {previews.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        Foto baru:
                    </p>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {previews.map((preview, index) => (
                            <div
                                key={`new-${index}`}
                                className="group relative aspect-square overflow-hidden rounded-md border"
                            >
                                <img
                                    src={preview.url}
                                    alt={`New photo ${index + 1}`}
                                    className="size-full object-cover"
                                />
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
