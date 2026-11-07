import '../css/app.css';
import './bootstrap';
import './types/table';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/Components/ThemeProvider';

function registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Clean up any old migration flag
    sessionStorage.removeItem('legacy-service-worker-removed');

    const doRegister = () => {
        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                console.info(
                    '%c ManPro PWA %c Service Worker aktif (Scope: ' + registration.scope + ')',
                    'background: #2563eb; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
                    'color: #2563eb; font-weight: 500;'
                );

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.info('ManPro PWA: Versi aplikasi baru tersedia.');
                            }
                        });
                    }
                });
            })
            .catch((error) => {
                console.warn('ManPro PWA: Pendaftaran Service Worker gagal:', error);
            });
    };

    if (document.readyState === 'complete') {
        doRegister();
    } else {
        window.addEventListener('load', doRegister);
    }
}

registerServiceWorker();

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
