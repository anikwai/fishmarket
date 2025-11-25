import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CreditCard,
    DollarSign,
    FileText,
    LayoutGrid,
    Receipt,
    ShoppingCart,
    UserCircle,
    UserCog,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: Array<NavItem & { permission?: string }> = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        permission: 'view dashboard',
    },
    {
        title: 'Suppliers',
        href: '/suppliers',
        icon: UserCircle,
        permission: 'view suppliers',
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: Users,
        permission: 'view customers',
    },
    {
        title: 'Purchases',
        href: '/purchases',
        icon: ShoppingCart,
        permission: 'view purchases',
    },
    {
        title: 'Sales',
        href: '/sales',
        icon: DollarSign,
        permission: 'view sales',
    },
    {
        title: 'Expenses',
        href: '/expenses',
        icon: Receipt,
        permission: 'view expenses',
    },
    {
        title: 'Payments',
        href: '/payments',
        icon: CreditCard,
        permission: 'view payments',
    },
    {
        title: 'Receipts',
        href: '/receipts',
        icon: FileText,
        permission: 'view receipts',
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
        permission: 'view reports',
    },
    {
        title: 'Users',
        href: '/users',
        icon: UserCog,
        permission: 'view users',
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<{
        auth: {
            user: unknown;
            permissions: string[];
        };
    }>().props;

    const userPermissions = auth.permissions || [];

    const filteredNavItems = mainNavItems.filter((item) => {
        if (!item.permission) {
            return true;
        }
        return userPermissions.includes(item.permission);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {footerNavItems.length > 0 && (
                    <NavFooter items={footerNavItems} className="mt-auto" />
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
