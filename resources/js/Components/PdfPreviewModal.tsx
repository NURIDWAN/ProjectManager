import { useCallback, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

interface PdfPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string;
    title?: string;
}

export function PdfPreviewModal({ open, onOpenChange, url, title }: PdfPreviewModalProps) {
    const [loading, setLoading] = useState(true);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                setLoading(true);
            }
            onOpenChange(nextOpen);
        },
        [onOpenChange],
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="flex h-[90vh] w-[95vw] max-w-[1200px] flex-col gap-0 overflow-hidden p-0"
            >
                <DialogTitle className="sr-only">{title ?? 'Preview PDF'}</DialogTitle>
                <DialogDescription className="sr-only">
                    Preview dokumen PDF
                </DialogDescription>

                {/* Header with close button */}
                <div className="flex shrink-0 items-center justify-between border-b bg-popover px-4 py-2">
                    <span className="text-sm font-medium text-foreground">
                        {title ?? 'Preview PDF'}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenChange(false)}
                        aria-label="Tutup"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                {/* PDF iframe - uses browser's built-in PDF viewer */}
                <div className="relative min-h-0 flex-1">
                    {/* Loading indicator */}
                    {loading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Memuat dokumen PDF...</p>
                        </div>
                    )}

                    {open && (
                        <iframe
                            src={url}
                            className="h-full w-full border-0"
                            title={title ?? 'Preview PDF'}
                            onLoad={() => setLoading(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
