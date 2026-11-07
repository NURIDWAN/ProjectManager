import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwa() {
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    });
    const [wasOffline, setWasOffline] = useState<boolean>(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setWasOffline(true);
            const timer = setTimeout(() => {
                setWasOffline(false);
            }, 4000);
            return () => clearTimeout(timer);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check standalone mode
        const checkStandalone = () => {
            const isStandalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as unknown as { standalone?: boolean }).standalone === true;
            setIsInstalled(Boolean(isStandalone));
        };

        checkStandalone();

        // Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        // Listen for appinstalled
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return false;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            setDeferredPrompt(null);
            return true;
        }
        return false;
    };

    const isIos =
        typeof navigator !== 'undefined' &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as unknown as { MSStream?: unknown }).MSStream;

    return {
        isOnline,
        wasOffline,
        canInstall: Boolean(deferredPrompt) && !isInstalled,
        isInstalled,
        isIos,
        promptInstall,
    };
}
