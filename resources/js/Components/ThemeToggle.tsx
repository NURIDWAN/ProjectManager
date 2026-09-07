import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" disabled aria-label="Memuat tema">
                <Sun className="size-4" />
            </Button>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
            title={isDark ? 'Tema terang' : 'Tema gelap'}
        >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
    );
}
