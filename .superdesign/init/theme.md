# Design System & Theme Tokens

## Part 1 — Compact Token Summary

### Color Palette (OKLCH Tokens)

#### Light Mode (`:root`)
- `--background`: `oklch(0.98 0 0)` (Soft Light Gray)
- `--foreground`: `oklch(0.18 0 0)` (Deep Off-Black)
- `--card`: `oklch(0.995 0 0)` (Pure White Card Surface)
- `--card-foreground`: `oklch(0.18 0 0)`
- `--popover`: `oklch(0.995 0 0)`
- `--primary`: `oklch(0.24 0 0)` (Dark Slate / Charcoal Primary Action)
- `--primary-foreground`: `oklch(0.985 0 0)` (White text on primary)
- `--secondary`: `oklch(0.94 0 0)` (Muted Light Gray Button/Badge)
- `--muted`: `oklch(0.95 0 0)`
- `--muted-foreground`: `oklch(0.5 0 0)` (Secondary Text Gray)
- `--accent`: `oklch(0.9 0 0)`
- `--destructive`: `oklch(0.42 0.12 25)` (Crimson Red)
- `--border`: `oklch(0.88 0 0)` (Subtle Gray Border)
- `--input`: `oklch(0.86 0 0)`
- `--ring`: `oklch(0.35 0 0)`
- `--sidebar`: `oklch(0.99 0 0)`
- `--sidebar-primary`: `oklch(0.24 0 0)`
- `--sidebar-accent`: `oklch(0.93 0 0)`

#### Dark Mode (`.dark`)
- `--background`: `oklch(0.12 0 0)` (Very Dark Charcoal Background)
- `--foreground`: `oklch(0.95 0 0)` (Bright Off-White Text)
- `--card`: `oklch(0.16 0 0)` (Elevated Dark Surface)
- `--card-foreground`: `oklch(0.95 0 0)`
- `--primary`: `oklch(0.9 0 0)` (Bright Crisp Light Action)
- `--primary-foreground`: `oklch(0.14 0 0)`
- `--secondary`: `oklch(0.24 0 0)`
- `--muted`: `oklch(0.22 0 0)`
- `--muted-foreground`: `oklch(0.7 0 0)`
- `--border`: `oklch(0.28 0 0)`
- `--sidebar`: `oklch(0.14 0 0)`
- `--sidebar-primary`: `oklch(0.9 0 0)`

### Typography & Radii
- **Font Family**: Inter Variable (`--font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif`)
- **Base Radius**: `0.75rem` (`12px`)
- `--radius-sm`: `8px` (`0.5rem`)
- `--radius-md`: `10px`
- `--radius-lg`: `12px` (`0.75rem`)
- `--radius-xl`: `16px`

---

## Part 2 — Raw Source Dumps

### CSS Configuration (`resources/css/app.css`)
```css
@import "tailwindcss";
@import "tw-animate-css";

@plugin "tailwindcss-animate";

@custom-variant dark (&:is(.dark *));

@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-display: swap;
  font-weight: 100 900;
  src: url('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2') format('woff2-variations');
}

:root {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.18 0 0);
  --card: oklch(0.995 0 0);
  --card-foreground: oklch(0.18 0 0);
  --popover: oklch(0.995 0 0);
  --popover-foreground: oklch(0.18 0 0);
  --primary: oklch(0.24 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.94 0 0);
  --secondary-foreground: oklch(0.24 0 0);
  --muted: oklch(0.95 0 0);
  --muted-foreground: oklch(0.5 0 0);
  --accent: oklch(0.9 0 0);
  --accent-foreground: oklch(0.2 0 0);
  --destructive: oklch(0.42 0.12 25);
  --border: oklch(0.88 0 0);
  --input: oklch(0.86 0 0);
  --ring: oklch(0.35 0 0);
  --chart-1: oklch(0.18 0 0);
  --chart-2: oklch(0.32 0 0);
  --chart-3: oklch(0.48 0 0);
  --chart-4: oklch(0.64 0 0);
  --chart-5: oklch(0.8 0 0);
  --radius: 0.75rem;
  --sidebar: oklch(0.99 0 0);
  --sidebar-foreground: oklch(0.18 0 0);
  --sidebar-primary: oklch(0.24 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.93 0 0);
  --sidebar-accent-foreground: oklch(0.22 0 0);
  --sidebar-border: oklch(0.88 0 0);
  --sidebar-ring: oklch(0.35 0 0);
}

.dark {
  --background: oklch(0.12 0 0);
  --foreground: oklch(0.95 0 0);
  --card: oklch(0.16 0 0);
  --card-foreground: oklch(0.95 0 0);
  --popover: oklch(0.18 0 0);
  --popover-foreground: oklch(0.95 0 0);
  --primary: oklch(0.9 0 0);
  --primary-foreground: oklch(0.14 0 0);
  --secondary: oklch(0.24 0 0);
  --secondary-foreground: oklch(0.96 0 0);
  --muted: oklch(0.22 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --accent: oklch(0.28 0 0);
  --accent-foreground: oklch(0.96 0 0);
  --destructive: oklch(0.55 0.08 25);
  --border: oklch(0.28 0 0);
  --input: oklch(0.32 0 0);
  --ring: oklch(0.82 0 0);
  --chart-1: oklch(0.9 0 0);
  --chart-2: oklch(0.76 0 0);
  --chart-3: oklch(0.6 0 0);
  --chart-4: oklch(0.46 0 0);
  --chart-5: oklch(0.32 0 0);
  --sidebar: oklch(0.14 0 0);
  --sidebar-foreground: oklch(0.95 0 0);
  --sidebar-primary: oklch(0.9 0 0);
  --sidebar-primary-foreground: oklch(0.14 0 0);
  --sidebar-accent: oklch(0.22 0 0);
  --sidebar-accent-foreground: oklch(0.96 0 0);
  --sidebar-border: oklch(0.28 0 0);
  --sidebar-ring: oklch(0.82 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
}
```
