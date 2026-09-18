# Extractable Reusable Components Catalog

## SidebarNav
- Source: `resources/js/Layouts/AuthenticatedLayout.tsx`
- Category: layout
- Description: Main application navigation sidebar with role-filtered menu groups and responsive collapsing.
- Extractable props: `currentUrl` (string, default: "/"), `collapsed` (boolean, default: false), `items` (NavItem[], default: navItems)
- Hardcoded: Group labels ("Ringkasan", "Master Data", "Operasional", "Administrasi"), Lucide icons, hover & active CSS classes.

## BottomNav
- Source: `resources/js/Layouts/AuthenticatedLayout.tsx`
- Category: layout
- Description: Mobile fixed bottom quick-navigation bar with overflow trigger menu.
- Extractable props: `currentUrl` (string, default: "/"), `items` (NavItem[])
- Hardcoded: Preferred labels ("Dashboard", "Laporan Kerja", "BAP", "Invoice"), fixed height (h-16), backdrop blur.

## UserMenu
- Source: `resources/js/Layouts/AuthenticatedLayout.tsx`
- Category: layout
- Description: User avatar dropdown menu displaying initials, name, email, profile link, and logout action.
- Extractable props: `user` (UserObject), `collapsed` (boolean, default: false)
- Hardcoded: "Profil", "Keluar" menu item labels, LogOut and User icons.

## PageHeader
- Source: `resources/js/Components/PageHeader.tsx`
- Category: basic
- Description: Standard header layout containing title, optional description subtitle, and action buttons container.
- Extractable props: `title` (string), `description` (string, optional), `actions` (ReactNode, optional)
- Hardcoded: Responsive flex container layout, font sizes (`text-2xl font-bold`).

## KpiCard
- Source: `resources/js/Components/KpiCard.tsx`
- Category: basic
- Description: Summary card for dashboard metrics with title kicker, primary metric value, optional trend badge, and description.
- Extractable props: `title` (string), `value` (string | number), `description` (string, optional), `icon` (ReactNode, optional), `trend` (ReactNode, optional)
- Hardcoded: Card wrapper padding, text uppercase tracking styling.

## StatusBadge
- Source: `resources/js/Components/StatusBadge.tsx`
- Category: basic
- Description: Status pill badge mapping domain state codes to colored background/text badges.
- Extractable props: `status` (string), `labelOverride` (string, optional)
- Hardcoded: Status mapping object (`draft`, `submitted`, `approved`, `rejected`, `paid`, `unpaid`, `pending`), OKLCH background colors.

## DataTable
- Source: `resources/js/Components/DataTable.tsx`
- Category: basic
- Description: Generic TanStack data table with search filtering, status tabs, pagination controls, and row action triggers.
- Extractable props: `columns` (ColumnDef[]), `data` (TData[]), `searchPlaceholder` (string, optional)
- Hardcoded: Table layout wrappers, pagination buttons ("Sebelumnya", "Berikutnya"), search icon.
