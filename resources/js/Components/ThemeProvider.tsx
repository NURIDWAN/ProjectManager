import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { PropsWithChildren } from 'react';

export function ThemeProvider({ children }: PropsWithChildren) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="manpro-theme"
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}
