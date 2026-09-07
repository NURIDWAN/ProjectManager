import '../css/app.css';
import './bootstrap';
import './types/table';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/Components/ThemeProvider';

const LEGACY_SERVICE_WORKER_PATH = '/sw.js';

async function removeLegacyServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    const registrations = await navigator.serviceWorker.getRegistrations();
    const legacyRegistrations = registrations.filter((registration) => {
        const scriptURL = registration.active?.scriptURL
            ?? registration.waiting?.scriptURL
            ?? registration.installing?.scriptURL;

        return scriptURL
            ? new URL(scriptURL).pathname === LEGACY_SERVICE_WORKER_PATH
            : false;
    });

    const results = await Promise.all(
        legacyRegistrations.map((registration) => registration.unregister()),
    );

    const removedControllingWorker = results.some(Boolean) && navigator.serviceWorker.controller;
    const reloadKey = 'legacy-service-worker-removed';

    if (removedControllingWorker && sessionStorage.getItem(reloadKey) !== 'true') {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
        return;
    }

    if (legacyRegistrations.length === 0) {
        sessionStorage.removeItem(reloadKey);
    }
}

void removeLegacyServiceWorker().catch(() => {
    // A stale worker can also disappear between inspection and unregister.
});

const initialPageElement = document.getElementById('app');
const initialPage = initialPageElement?.dataset.page
    ? JSON.parse(initialPageElement.dataset.page)
    : null;
const appName = initialPage?.props?.company?.name || import.meta.env.VITE_APP_NAME || 'ManPro';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeProvider>
                <App {...props} />
                <Toaster position="top-right" richColors />
            </ThemeProvider>
        );
    },
    progress: {
        color: '#2563eb',
    },
});
