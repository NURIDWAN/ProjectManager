import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/** Milliseconds to wait before re-showing an identical autosave error toast. */
const ERROR_TOAST_COOLDOWN_MS = 30_000;

interface AutosaveOptions {
    /** Milliseconds of inactivity before the save fires. */
    debounceMs?: number;
    /** Called before each save; return false to skip this save. */
    buildPayload?: () => Record<string, unknown> | false;
    /** Called right after a new draft id becomes known. */
    onDraftCreated?: (id: number) => void;
    /** Show a toast when a save fails. */
    onError?: (message: string) => void;
}

interface AutosaveResult {
    state: SaveState;
    lastSavedAt: string | null;
    reportId: number | null;
    /** Mark the form as having unsaved changes and (re)start the debounce timer. */
    markDirty: () => void;
    /** Immediately save any pending changes (flush). Resolves with success. */
    flush: () => Promise<boolean>;
    /** Force state back to idle (after manual submit). */
    reset: () => void;
}

/**
 * Autosave hook for work report drafts.
 *
 * - Debounces changes (default 2.5s) and POSTs to /work-reports/autosave.
 * - The first save creates the draft and captures its id.
 * - flush() immediately persists pending changes (used before submit,
 *   photo upload, pagehide, etc.).
 */
export function useWorkReportAutosave({
    debounceMs = 2500,
    buildPayload,
    onDraftCreated,
    onError,
}: AutosaveOptions = {}): AutosaveResult {
    const [state, setState] = useState<SaveState>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [reportId, setReportId] = useState<number | null>(null);

    const reportIdRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef(false);
    const inFlightRef = useRef(false);
    const savedPayloadRef = useRef<string>('');
    const mountedRef = useRef(true);
    // Dedupe error toasts: remember the last (message, time) so repeated
    // failures do not spam the user with identical toasts every debounce.
    const lastErrorRef = useRef<{ message: string; at: number } | null>(null);

    const buildPayloadRef = useRef(buildPayload);
    buildPayloadRef.current = buildPayload;
    const onDraftCreatedRef = useRef(onDraftCreated);
    onDraftCreatedRef.current = onDraftCreated;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const reportError = useCallback((message: string) => {
        const now = Date.now();
        const last = lastErrorRef.current;
        if (last && last.message === message && now - last.at < ERROR_TOAST_COOLDOWN_MS) {
            // Same message within the cooldown window: skip the toast,
            // the SaveStatusIndicator already shows a persistent state.
            return;
        }
        lastErrorRef.current = { message, at: now };
        onErrorRef.current?.(message);
    }, []);

    const performSave = useCallback(async (): Promise<boolean> => {
        // Another save is running: remember that changes may exist, they will
        // be picked up by the trailing call below.
        if (inFlightRef.current) {
            pendingRef.current = true;

            return false;
        }

        const payload = buildPayloadRef.current?.() ?? {};
        if (payload === false) {
            return false;
        }

        const serialized = JSON.stringify(payload);
        if (reportIdRef.current !== null && serialized === savedPayloadRef.current) {
            return true; // nothing new to persist
        }

        inFlightRef.current = true;
        setState('saving');
        pendingRef.current = false;

        try {
            const response = await fetch('/work-reports/autosave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                            ?.content ?? '',
                },
                body: JSON.stringify({
                    ...payload,
                    ...(reportIdRef.current !== null ? { id: reportIdRef.current } : {}),
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                const message =
                    (data as { message?: string } | null)?.message ??
                    'Gagal menyimpan otomatis.';

                // Deduped: identical messages within the cooldown window do
                // not re-toast, the status indicator already shows the error.
                reportError(message);

                if (mountedRef.current) {
                    setState('error');
                }

                return false;
            }

            const data = (await response.json()) as { id: number; saved_at: string };

            if (reportIdRef.current === null) {
                reportIdRef.current = data.id;
                setReportId(data.id);
                onDraftCreatedRef.current?.(data.id);
            }

            savedPayloadRef.current = JSON.stringify({ ...payload, id: data.id });
            setLastSavedAt(data.saved_at);
            // Save succeeded: allow the next failure to toast immediately.
            lastErrorRef.current = null;

            if (mountedRef.current) {
                setState('saved');
            }

            return true;
        } catch {
            reportError('Gagal menyimpan otomatis. Periksa koneksi Anda.');

            if (mountedRef.current) {
                setState('error');
            }

            return false;
        } finally {
            inFlightRef.current = false;

            // If changes happened while saving, persist them now.
            if (pendingRef.current && mountedRef.current) {
                pendingRef.current = false;
                void performSave();
            }
        }
    }, []);

    const markDirty = useCallback(() => {
        setState((prev) => (prev === 'saving' ? prev : 'dirty'));
        pendingRef.current = true;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            void performSave();
        }, debounceMs);
    }, [debounceMs, performSave]);

    const flush = useCallback(async (): Promise<boolean> => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (!pendingRef.current && reportIdRef.current !== null) {
            return true;
        }

        return performSave();
    }, [performSave]);

    const reset = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        pendingRef.current = false;
        setState('idle');
    }, []);

    // Warn before leaving with unsaved changes, and flush on unload.
    useEffect(() => {
        mountedRef.current = true;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (pendingRef.current || state === 'dirty' || state === 'saving') {
                e.preventDefault();
            }
        };

        const handlePageHide = () => {
            if (pendingRef.current) {
                void performSave();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            mountedRef.current = false;
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [performSave, state]);

    return {
        state,
        lastSavedAt,
        reportId,
        markDirty,
        flush,
        reset,
    };
}
