import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useMemo, useState } from 'react';
import {
    ChevronUp,
    ClipboardCheck,
    FileCheck,
    FileText,
    FolderKanban,
    LayoutDashboard,
    LogOut,
    Menu,
    MoreHorizontal,
    Package,
    PanelLeft,
    PanelLeftClose,
    Receipt,
    Settings,
    Shield,
    User,
    UserCog,
    Users,
} from 'lucide-react';
import { BrandIdentity } from '@/Components/BrandIdentity';
import { ThemeToggle } from '@/Components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

type AppRole = 'admin' | 'technician' | 'staff';

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    roles: AppRole[];
    group: 'overview' | 'master' | 'operations' | 'administration';
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, roles: ['admin'], group: 'overview' },
    { label: 'Klien', href: '/clients', icon: <Users />, roles: ['admin'], group: 'master' },
    { label: 'Kategori Pekerjaan', href: '/job-categories', icon: <FolderKanban />, roles: ['admin'], group: 'master' },
    { label: 'Jasa/Produk', href: '/services', icon: <Package />, roles: ['admin'], group: 'master' },
    { label: 'Laporan Kerja', href: '/work-reports', icon: <FileText />, roles: ['admin', 'technician', 'staff'], group: 'operations' },
    { label: 'BAP', href: '/baps', icon: <FileCheck />, roles: ['admin'], group: 'operations' },
    { label: 'BAST', href: '/basts', icon: <ClipboardCheck />, roles: ['admin'], group: 'operations' },
    { label: 'Invoice', href: '/invoices', icon: <Receipt />, roles: ['admin'], group: 'operations' },
    { label: 'Pengaturan', href: '/settings/company', icon: <Settings />, roles: ['admin'], group: 'administration' },
    { label: 'Pengguna', href: '/users', icon: <UserCog />, roles: ['admin'], group: 'administration' },
    { label: 'Role & Perizinan', href: '/roles', icon: <Shield />, roles: ['admin'], group: 'administration' },
];

const groupLabels: Record<NavItem['group'], string> = {
    overview: 'Ringkasan',
    master: 'Master Data',
    operations: 'Operasional',
    administration: 'Administrasi',
};

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

function isActivePath(currentUrl: string, href: string) {
    return currentUrl === href || currentUrl.startsWith(`${href}/`) || currentUrl.startsWith(`${href}?`);
}

function SidebarNav({
    items,
    currentUrl,
    collapsed,
    onNavigate,
}: {
    items: NavItem[];
    currentUrl: string;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const groups = useMemo(
        () => (Object.keys(groupLabels) as NavItem['group'][])
            .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
            .filter((entry) => entry.items.length > 0),
        [items],
    );

    return (
        <nav aria-label="Navigasi utama" className="space-y-5 px-2 py-4">
            {groups.map(({ group, items: groupItems }) => (
                <div key={group}>
                    {!collapsed && (
                        <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50">
                            {groupLabels[group]}
                        </p>
                    )}
                    {collapsed && group !== groups[0].group && <div className="mx-2 mb-2 border-t border-sidebar-border" />}
                    <div className="space-y-1">
                        {groupItems.map((item) => {
                            const active = isActivePath(currentUrl, item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    title={collapsed ? item.label : undefined}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'group flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground/70 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                                        collapsed && 'justify-center px-2',
                                        active
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'hover:bg-sidebar-accent/55 hover:text-sidebar-foreground',
                                    )}
                                >
                                    <span className={cn('shrink-0 [&>svg]:size-[18px] [&>svg]:stroke-[1.8]', active && 'text-sidebar-primary')}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}

function UserMenu({ user, collapsed = false }: { user: PageProps['auth']['user']; collapsed?: boolean }) {
    const initials = user.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    collapsed && 'justify-center',
                )}
            >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                    {initials}
                </div>
                {!collapsed && (
                    <>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-sidebar-foreground">{user.name}</p>
                            <p className="truncate text-xs text-sidebar-foreground/55">{user.email}</p>
                        </div>
                        <ChevronUp className="size-4 shrink-0 text-sidebar-foreground/45" />
                    </>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? 'right' : 'top'} align="start" sideOffset={8} className="w-60">
                <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" />}>
                    <User className="size-4" />
                    Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" render={<Link href="/logout" method="post" as="button" />} className="w-full">
                    <LogOut className="size-4" />
                    Keluar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function MobileMenu({
    items,
    currentUrl,
    company,
    trigger,
}: {
    items: NavItem[];
    currentUrl: string;
    company: PageProps['company'];
    trigger: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={trigger as React.ReactElement} />
            <SheetContent side="left" className="w-[86vw] max-w-80 gap-0 p-0">
                <SheetHeader className="border-b px-4 py-3.5">
                    <SheetTitle>
                        <BrandIdentity name={company.name} logoUrl={company.logoUrl} />
                    </SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <SidebarNav items={items} currentUrl={currentUrl} collapsed={false} onNavigate={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}

function BottomNav({ items, currentUrl, company }: { items: NavItem[]; currentUrl: string; company: PageProps['company'] }) {
    const preferred = ['Dashboard', 'Laporan Kerja', 'BAP', 'Invoice'];
    const primaryItems = preferred
        .map((label) => items.find((item) => item.label === label))
        .filter((item): item is NavItem => Boolean(item));

    return (
        <nav aria-label="Navigasi cepat" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
            <div className="mx-auto grid h-16 max-w-lg grid-flow-col auto-cols-fr px-1.5">
                {primaryItems.map((item) => {
                    const active = isActivePath(currentUrl, item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                active ? 'text-primary' : 'text-muted-foreground',
                            )}
                        >
                            <span className="[&>svg]:size-5 [&>svg]:stroke-[1.8]">{item.icon}</span>
                            <span className="max-w-full truncate">{item.label}</span>
                        </Link>
                    );
                })}
                <MobileMenu
                    items={items}
                    currentUrl={currentUrl}
                    company={company}
                    trigger={
                        <button className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <MoreHorizontal className="size-5" strokeWidth={1.8} />
                            <span>Menu</span>
                        </button>
                    }
                />
            </div>
        </nav>
    );
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, company } = usePage<PageProps>().props;
    const currentUrl = usePage().url;
    const user = auth.user;
    const userRoles = user.roles?.map((role) => role.name) ?? [user.role];
    const filteredItems = navItems.filter((item) => item.roles.some((role) => userRoles.includes(role)));
    const [collapsed, setCollapsed] = useState(() =>
        typeof window !== 'undefined' && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
    );

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    }, [collapsed]);

    return (
        <div className="min-h-[100dvh] bg-background">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-md lg:hidden">
                <MobileMenu
                    items={filteredItems}
                    currentUrl={currentUrl}
                    company={company}
                    trigger={
                        <Button variant="ghost" size="icon" aria-label="Buka navigasi">
                            <Menu className="size-5" />
                        </Button>
                    }
                />
                <BrandIdentity name={company.name} logoUrl={company.logoUrl} className="min-w-0 flex-1" />
                <ThemeToggle />
            </header>

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex lg:flex-col',
                    collapsed ? 'w-[72px]' : 'w-64',
                )}
            >
                <div className="flex h-16 items-center border-b border-sidebar-border px-3">
                    <Link href="/" className="min-w-0 flex-1">
                        <BrandIdentity name={company.name} logoUrl={company.logoUrl} compact={collapsed} />
                    </Link>
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setCollapsed(true)}
                            aria-label="Ciutkan sidebar"
                            className="shrink-0"
                        >
                            <PanelLeftClose className="size-4" />
                        </Button>
                    )}
                    {collapsed && (
                        <Button
                            variant="secondary"
                            size="icon-sm"
                            className="absolute -right-4 top-5 z-40 h-8 w-8 rounded-full border border-sidebar-border bg-background text-foreground shadow-md hover:bg-muted"
                            onClick={() => setCollapsed(false)}
                            aria-label="Perluas sidebar"
                        >
                            <PanelLeft className="size-4" />
                        </Button>
                    )}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <SidebarNav items={filteredItems} currentUrl={currentUrl} collapsed={collapsed} />
                </div>
                <div className="space-y-1 border-t border-sidebar-border p-2">
                    <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
                        {!collapsed && <span className="px-2 text-xs font-medium text-sidebar-foreground/55">Tampilan</span>}
                        <ThemeToggle />
                    </div>
                    <UserMenu user={user} collapsed={collapsed} />
                </div>
            </aside>

            <main className={cn('min-w-0 pb-24 transition-[padding] duration-200 lg:pb-0', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
                {header && (
                    <div className="border-b bg-card/55">
                        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">{header}</div>
                    </div>
                )}
                <div className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">{children}</div>
            </main>

            <BottomNav items={filteredItems} currentUrl={currentUrl} company={company} />
        </div>
    );
}
