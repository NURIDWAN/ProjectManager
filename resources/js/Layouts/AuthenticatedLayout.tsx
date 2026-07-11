import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Package,
    FileText,
    FileCheck,
    Receipt,
    Menu,
    LogOut,
    User,
    PanelLeftClose,
    PanelLeft,
    ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    roles: ('admin' | 'technician')[];
}

const navItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="size-4" />,
        roles: ['admin'],
    },
    {
        label: 'Klien',
        href: '/clients',
        icon: <Users className="size-4" />,
        roles: ['admin'],
    },
    {
        label: 'Kategori Pekerjaan',
        href: '/job-categories',
        icon: <FolderKanban className="size-4" />,
        roles: ['admin'],
    },
    {
        label: 'Jasa/Produk',
        href: '/services',
        icon: <Package className="size-4" />,
        roles: ['admin'],
    },
    {
        label: 'Laporan Kerja',
        href: '/work-reports',
        icon: <FileText className="size-4" />,
        roles: ['admin', 'technician'],
    },
    {
        label: 'BAP',
        href: '/baps',
        icon: <FileCheck className="size-4" />,
        roles: ['admin'],
    },
    {
        label: 'Invoice',
        href: '/invoices',
        icon: <Receipt className="size-4" />,
        roles: ['admin'],
    },
];

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

function SidebarNav({
    role,
    currentUrl,
    collapsed,
}: {
    role: 'admin' | 'technician';
    currentUrl: string;
    collapsed: boolean;
}) {
    const filteredItems = navItems.filter((item) => item.roles.includes(role));

    const masterDataItems = filteredItems.filter((item) =>
        ['Klien', 'Kategori Pekerjaan', 'Jasa/Produk'].includes(item.label)
    );
    const operationalItems = filteredItems.filter((item) =>
        ['Laporan Kerja', 'BAP', 'Invoice'].includes(item.label)
    );
    const dashboardItem = filteredItems.find((item) => item.label === 'Dashboard');

    const isActive = (item: NavItem) => {
        return currentUrl.startsWith(item.href);
    };

    const renderNavItem = (item: NavItem) => {
        const button = (
            <Link key={item.href} href={item.href}>
                <Button
                    variant={isActive(item) ? 'secondary' : 'ghost'}
                    className={cn(
                        'w-full gap-2',
                        collapsed ? 'justify-center px-2' : 'justify-start'
                    )}
                    size={collapsed ? 'icon' : 'default'}
                >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                </Button>
            </Link>
        );

        if (collapsed) {
            return (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return button;
    };

    return (
        <nav className={cn('flex flex-col gap-1 py-4', collapsed ? 'px-2' : 'px-3')}>
            {dashboardItem && (
                <>
                    {renderNavItem(dashboardItem)}
                    <Separator className="my-2" />
                </>
            )}

            {masterDataItems.length > 0 && (
                <>
                    {!collapsed && (
                        <p className="px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
                            Master Data
                        </p>
                    )}
                    {collapsed && <Separator className="my-1" />}
                    {masterDataItems.map(renderNavItem)}
                    <Separator className="my-2" />
                </>
            )}

            {operationalItems.length > 0 && (
                <>
                    {!collapsed && (
                        <p className="px-3 py-1 text-xs font-semibold uppercase text-muted-foreground">
                            Operasional
                        </p>
                    )}
                    {operationalItems.map(renderNavItem)}
                </>
            )}
        </nav>
    );
}

function UserMenu({
    user,
    collapsed,
}: {
    user: { name: string; email: string; role: string };
    collapsed: boolean;
}) {
    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        'flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        collapsed && 'justify-center'
                    )}
                >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                    </div>
                    {!collapsed && (
                        <>
                            <div className="flex-1 truncate">
                                <p className="truncate text-sm font-medium leading-tight">
                                    {user.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                            <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side={collapsed ? 'right' : 'top'}
                align={collapsed ? 'start' : 'center'}
                className="w-56"
            >
                <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                        <User className="size-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2 text-destructive focus:text-destructive"
                    >
                        <LogOut className="size-4" />
                        Logout
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const currentUrl = usePage().url;

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    }, [collapsed]);

    const sidebarWidth = collapsed ? 'w-16' : 'w-64';
    const mainPadding = collapsed ? 'lg:pl-16' : 'lg:pl-64';

    return (
        <TooltipProvider delayDuration={0}>
            <div className="min-h-screen bg-gray-50">
                {/* Mobile/Tablet Top Bar */}
                <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white px-4 lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="size-5" />
                                <span className="sr-only">Toggle navigation</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <SheetHeader className="border-b px-4 py-3">
                                <SheetTitle className="text-lg font-bold">
                                    ManPro
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex h-[calc(100vh-57px)] flex-col">
                                <div className="flex-1 overflow-y-auto">
                                    <SidebarNav
                                        role={user.role}
                                        currentUrl={currentUrl}
                                        collapsed={false}
                                    />
                                </div>
                                <div className="border-t p-3">
                                    <UserMenu user={user} collapsed={false} />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <h1 className="text-lg font-semibold">ManPro</h1>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {user.name}
                        </span>
                    </div>
                </header>

                <div className="flex">
                    {/* Desktop Sidebar */}
                    <aside
                        className={cn(
                            'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-200 ease-in-out',
                            sidebarWidth
                        )}
                    >
                        <div className="flex h-full flex-col border-r bg-white">
                            {/* Logo + Collapse Toggle */}
                            <div className="flex h-14 items-center border-b px-3">
                                {!collapsed && (
                                    <Link
                                        href="/"
                                        className="flex-1 truncate text-lg font-bold"
                                    >
                                        ManPro
                                    </Link>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        'size-8 shrink-0',
                                        collapsed && 'mx-auto'
                                    )}
                                    onClick={() => setCollapsed(!collapsed)}
                                    aria-label={
                                        collapsed
                                            ? 'Expand sidebar'
                                            : 'Collapse sidebar'
                                    }
                                >
                                    {collapsed ? (
                                        <PanelLeft className="size-4" />
                                    ) : (
                                        <PanelLeftClose className="size-4" />
                                    )}
                                </Button>
                            </div>

                            {/* Navigation */}
                            <div className="flex-1 overflow-y-auto">
                                <SidebarNav
                                    role={user.role}
                                    currentUrl={currentUrl}
                                    collapsed={collapsed}
                                />
                            </div>

                            {/* User Section */}
                            <div className="border-t p-2">
                                <UserMenu user={user} collapsed={collapsed} />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main
                        className={cn(
                            'flex-1 transition-all duration-200 ease-in-out',
                            mainPadding
                        )}
                    >
                        {header && (
                            <div className="border-b bg-white">
                                <div className="px-4 py-6 sm:px-6 lg:px-8">
                                    {header}
                                </div>
                            </div>
                        )}
                        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
