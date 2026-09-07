import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Camera,
    CameraOff,
    Check,
    CircleAlert,
    Loader2,
    Plus,
    RotateCcw,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CapturedPhoto {
    id: number;
    photo_url: string;
    caption: string;
    file?: File;
}

interface PhotoCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Type of photo: 'before' or 'after'. Used for endpoint and caption marker. */
    photoType: 'before' | 'after';
    /** Unit index for AC photos (null for non-AC). Photo caption will be 'ac_unit_{index}:caption'. */
    unitIndex: number | null;
    /** Upload function that returns the saved photo. Must throw on failure. */
    uploadFile: (file: File, caption: string) => Promise<CapturedPhoto>;
    /** Delete function for uploaded photos. Must throw on failure. */
    deletePhoto: (photo: CapturedPhoto) => Promise<void>;
    /** Called when a new photo is added. */
    onPhotoAdded: (photo: CapturedPhoto) => void;
    /** Existing photos to display and manage. */
    existingPhotos: CapturedPhoto[];
    /** Called when photos change (add/remove). */
    onPhotosChange: (photos: CapturedPhoto[]) => void;
    /** Maximum file size in MB. */
    maxSizeMB?: number;
}

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Compress a captured frame (data URL) until it fits within maxSizeMB.
 * Camera sensors produce huge frames (often >2MB at quality 0.9), which the
 * server rejects (max:2048). Downscale to a sane long edge first, then step
 * down JPEG quality until the blob is small enough.
 */
async function compressDataUrl(dataUrl: string, maxSizeMB: number): Promise<File> {
    const maxBytes = maxSizeMB * 1024 * 1024;
    const maxLongEdge = 1600;

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Gagal memproses gambar'));
        img.src = dataUrl;
    });

    const scale = Math.min(1, maxLongEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal memproses gambar');
    ctx.drawImage(img, 0, 0, width, height);

    // Step down quality until the encoded JPEG fits the size limit.
    for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
        );
        if (blob && blob.size <= maxBytes) {
            return new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        }
        if (quality === 0.45 && blob) {
            // Even at the lowest quality it is too large — still send it so the
            // server returns a proper validation error instead of silence.
            return new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        }
    }

    throw new Error('Gagal mengompres foto');
}

/**
 * Modal for capturing/uploading photos with camera or file picker.
 * Features:
 * - Tab switching between upload and camera capture
 * - Live camera preview with device camera selection
 * - Captured photos shown as thumbnails with caption editing
 * - Immediate upload to server on capture
 * - Delete capability for uploaded photos
 */
export function PhotoCaptureModal({
    open,
    onOpenChange,
    photoType,
    unitIndex,
    uploadFile,
    deletePhoto,
    onPhotoAdded,
    existingPhotos,
    onPhotosChange,
    maxSizeMB = 2,
}: PhotoCaptureModalProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
    const [capturing, setCapturing] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [devices, setDevices] = useState<{ label: string; value: string }[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [currentCaption, setCurrentCaption] = useState('');
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [capturedSnapshots, setCapturedSnapshots] = useState<{ id: number; dataUrl: string; caption: string }[]>([]);
    /** Last captured photo awaiting review (retake or accept). */
    const [pendingReview, setPendingReview] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup camera stream when modal closes or component unmounts
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Stop camera when modal closes
    useEffect(() => {
        if (!open) {
            stopCamera();
            resetState();
        }
    }, [open]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCapturing(false);
        setCameraError(null);
    }, []);

    const resetState = useCallback(() => {
        setActiveTab('upload');
        setCurrentCaption('');
        setCapturedSnapshots([]);
        setCameraError(null);
        setSelectedDevice('');
        setPendingReview(null);
    }, []);

    // Get available cameras
    const enumerateCameras = useCallback(async () => {
        try {
            // Request permission first to get labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach((track) => track.stop());

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices
                .filter((d) => d.kind === 'videoinput')
                .map((d) => ({
                    label: d.label || `Kamera ${d.deviceId.slice(0, 6)}...`,
                    value: d.deviceId,
                }));
            setDevices(videoDevices);
            if (videoDevices.length > 0 && !selectedDevice) {
                setSelectedDevice(videoDevices[0].value);
            }
        } catch {
            // Permission denied or not available
        }
    }, [selectedDevice]);

    // Attach stream to the video element whenever it becomes available.
    // The video element is always mounted in the camera tab, so we can
    // assign the stream here instead of racing against React rendering.
    useEffect(() => {
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            void videoRef.current.play().catch(() => {
                // autoplay may reject; playsInline + muted usually allows it
            });
        }
    }, [capturing, activeTab]);

    // Start camera
    const startCamera = useCallback(async () => {
        stopCamera();
        setCameraError(null);
        setPendingReview(null);

        try {
            const constraints: MediaStreamConstraints = {
                video: selectedDevice
                    ? { deviceId: { exact: selectedDevice }, width: { ideal: 1920 }, height: { ideal: 1080 } }
                    : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setCapturing(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Gagal mengakses kamera';
            setCameraError(message);
            toast.error(message);
        }
    }, [selectedDevice, stopCamera]);

    // Stop camera
    const handleStopCamera = useCallback(() => {
        stopCamera();
    }, [stopCamera]);

    // Capture a still frame from the live video into a review state
    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        if (!video || !streamRef.current || !video.videoWidth) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        setPendingReview(canvas.toDataURL('image/jpeg', 0.9));
    }, []);

    // Retake: discard the pending capture and return to the live preview
    const retakePhoto = useCallback(() => {
        setPendingReview(null);
    }, []);

    // Accept the reviewed capture: keep stream alive, queue the snapshot for upload
    const acceptCapture = useCallback(() => {
        if (!pendingReview) return;

        setCapturedSnapshots((prev) => [
            ...prev,
            { id: Date.now(), dataUrl: pendingReview, caption: currentCaption },
        ]);
        setPendingReview(null);
    }, [pendingReview, currentCaption]);

    // Upload captured photo
    const uploadCapturedPhoto = useCallback(
        async (snapshot: { id: number; dataUrl: string; caption: string }) => {
            setUploadingId(snapshot.id);

            try {
                // Compress: camera frames are often far above the 2MB server limit
                const file = await compressDataUrl(snapshot.dataUrl, maxSizeMB);

                const baseCaption = snapshot.caption || '';

                const uploaded = await uploadFile(file, baseCaption);

                // Remove from snapshots and add to existing photos.
                // Only call onPhotoAdded — the parent owns the list state and
                // must append there. Calling onPhotosChange with a closure over
                // existingPhotos here overwrites parallel uploads (stale closure).
                setCapturedSnapshots((prev) => prev.filter((s) => s.id !== snapshot.id));
                onPhotoAdded({ ...uploaded, caption: baseCaption });
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Gagal mengunggah foto');
                // Keep the snapshot so the user can retry via "Unggah Semua"
            } finally {
                setUploadingId(null);
            }
        },
        [uploadFile, onPhotoAdded, setCapturedSnapshots, maxSizeMB]
    );

    // Upload all captured photos
    const uploadAllCaptured = useCallback(() => {
        capturedSnapshots.forEach((snapshot) => {
            void uploadCapturedPhoto(snapshot);
        });
    }, [capturedSnapshots, uploadCapturedPhoto]);

    // Handle file upload
    const handleFileUpload = useCallback(
        async (files: FileList | null) => {
            if (!files) return;

            const validFiles = Array.from(files).filter(
                (file) => VALID_TYPES.includes(file.type) && file.size <= maxSizeMB * 1024 * 1024
            );

            for (const file of validFiles) {
                try {
                    const finalCaption = unitIndex !== null ? `ac_unit_${unitIndex}:${file.name}` : file.name;
                    const uploaded = await uploadFile(file, file.name);
                    // Parent owns the list state — append there only (avoids
                    // stale-closure overwrites of the existing photo list).
                    onPhotoAdded({ ...uploaded, caption: file.name });
                } catch {
                    toast.error(`Gagal mengunggah ${file.name}`);
                }
            }
        },
        [uploadFile, unitIndex, onPhotoAdded, maxSizeMB]
    );

    // Delete photo
    const handleDeletePhoto = useCallback(
        async (photo: CapturedPhoto) => {
            try {
                await deletePhoto(photo);
                // Parent owns the list state — remove there only (avoids
                // stale-closure overwrites of the existing photo list).
                onPhotosChange(existingPhotos.filter((p) => p.id !== photo.id));
            } catch {
                toast.error('Gagal menghapus foto');
            }
        },
        [deletePhoto, existingPhotos, onPhotosChange]
    );

    // Request camera permissions on mount
    useEffect(() => {
        if (open) {
            void enumerateCameras();
        }
    }, [open, enumerateCameras]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Dokumentasi Foto</DialogTitle>
                    <DialogDescription>
                        {photoType === 'before' ? 'Foto sebelum pekerjaan' : 'Foto sesudah pekerjaan'}
                        {unitIndex !== null && ` - Unit AC #${unitIndex + 1}`}
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                    <Button
                        type="button"
                        className={cn(
                            'flex-1',
                            activeTab === 'upload'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'bg-background hover:bg-muted hover:text-foreground',
                        )}
                        onClick={() => {
                            stopCamera();
                            setActiveTab('upload');
                        }}
                    >
                        <Upload className="mr-2 size-4" />
                        Upload File
                    </Button>
                    <Button
                        type="button"
                        className={cn(
                            'flex-1',
                            activeTab === 'camera'
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'bg-background hover:bg-muted hover:text-foreground',
                        )}
                        onClick={() => {
                            setActiveTab('camera');
                            if (!capturing) {
                                void startCamera();
                            }
                        }}
                    >
                        <Camera className="mr-2 size-4" />
                        Ambil Foto
                    </Button>
                </div>

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div className="space-y-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
                                'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                            )}
                        >
                            <Upload className="mb-3 size-10 text-muted-foreground" />
                            <p className="text-sm font-medium">Klik untuk pilih file atau drag & drop</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                JPG, PNG. Maksimal {maxSizeMB}MB per foto.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                multiple
                                onChange={(e) => void handleFileUpload(e.target.files)}
                                className="sr-only"
                            />
                        </div>
                    </div>
                )}

                {/* Camera Tab */}
                {activeTab === 'camera' && (
                    <div className="space-y-4">
                        {/* Camera Selection */}
                        {devices.length > 1 && (
                            <div className="space-y-2">
                                <Label>Pilih Kamera</Label>
                                <select
                                    value={selectedDevice}
                                    onChange={(e) => setSelectedDevice(e.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {devices.map((device) => (
                                        <option key={device.value} value={device.value}>
                                            {device.label || `Kamera ${device.value.slice(0, 6)}...`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Camera Preview — video stays mounted so the stream can attach */}
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={cn(
                                    'absolute inset-0 size-full object-cover',
                                    (!capturing || pendingReview !== null) && 'invisible',
                                )}
                            />

                            {pendingReview ? (
                                /* Review of the just-captured frame */
                                <div className="absolute inset-0">
                                    <img
                                        src={pendingReview}
                                        alt="Hasil jepretan"
                                        className="size-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent p-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={uploadingId !== null}
                                            onClick={retakePhoto}
                                            className="border-white bg-black/50 text-white hover:bg-white/20"
                                        >
                                            <RotateCcw className="mr-2 size-4" />
                                            Ulang
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={acceptCapture}
                                        >
                                            <Check className="mr-2 size-4" />
                                            Gunakan Foto
                                        </Button>
                                    </div>
                                </div>
                            ) : capturing ? (
                                <>
                                    {/* Take (shutter) Button */}
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent p-4">
                                        <button
                                            type="button"
                                            onClick={capturePhoto}
                                            aria-label="Jepret foto"
                                            className="flex size-16 items-center justify-center rounded-full bg-white/90 ring-4 ring-white/40 transition-transform hover:scale-105 active:scale-95"
                                        >
                                            <div className="size-12 rounded-full bg-primary" />
                                        </button>
                                    </div>
                                    {/* Stop Button */}
                                    <div className="absolute right-3 top-3">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={handleStopCamera}
                                        >
                                            <CameraOff className="size-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : cameraError ? (
                                <div className="absolute inset-0 flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-white">
                                    <CircleAlert className="size-10 text-destructive" />
                                    <p className="text-sm">{cameraError}</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void startCamera()}
                                        className="border-white text-white hover:bg-white/20"
                                    >
                                        Coba Lagi
                                    </Button>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex size-full flex-col items-center justify-center gap-3 text-white/70">
                                    <Camera className="size-12" />
                                    <p className="text-sm">Kamera belum aktif</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => void startCamera()}
                                        className="border-white text-white hover:bg-white/20"
                                    >
                                        Mulai Kamera
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Caption — always visible while in camera tab */}
                        <div className="space-y-2">
                            <Label htmlFor="photo-capture-caption">Keterangan (opsional)</Label>
                            <Input
                                id="photo-capture-caption"
                                value={currentCaption}
                                onChange={(e) => setCurrentCaption(e.target.value)}
                                placeholder="Contoh: Kondisi sebelum perbaikan"
                            />
                        </div>

                        {/* Captured Snapshots */}
                        {capturedSnapshots.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Foto Siap Unggah ({capturedSnapshots.length})</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={uploadAllCaptured}
                                        disabled={uploadingId !== null}
                                    >
                                        {uploadingId !== null ? (
                                            <>
                                                <Loader2 className="mr-2 size-3 animate-spin" />
                                                Mengunggah...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="mr-2 size-3" />
                                                Unggah Semua
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {capturedSnapshots.map((snapshot) => (
                                        <div key={snapshot.id} className="relative aspect-square rounded-lg overflow-hidden border">
                                            <img
                                                src={snapshot.dataUrl}
                                                alt="Tangkapan kamera"
                                                className="size-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() =>
                                                        setCapturedSnapshots((prev) =>
                                                            prev.filter((s) => s.id !== snapshot.id)
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Existing Photos */}
                {existingPhotos.length > 0 && (
                    <div className="space-y-2">
                        <Label>Foto Tersimpan ({existingPhotos.length})</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {existingPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group relative aspect-square rounded-lg overflow-hidden border"
                                >
                                    <img
                                        src={photo.photo_url}
                                        alt={photo.caption || 'Foto'}
                                        className="size-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="size-8"
                                            onClick={() => void handleDeletePhoto(photo)}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
