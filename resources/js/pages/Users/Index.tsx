import UserController from '@/actions/App/Http/Controllers/UserController';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, router } from '@inertiajs/react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowUpDown,
    CheckCircle2,
    Eye,
    EyeOff,
    InfoIcon,
    LoaderCircle,
    Lock,
    Mail,
    PencilIcon,
    PlusIcon,
    Search,
    Shield,
    TrashIcon,
    User,
    Users,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// RoleSelect component that works with native form submission
function RoleSelect({
    defaultValue,
    roles,
    id,
    hasError,
}: {
    defaultValue: string;
    roles: Role[];
    id?: string;
    hasError?: boolean;
}) {
    const [value, setValue] = useState(defaultValue);

    return (
        <div className="relative">
            <input type="hidden" name="role" value={value} />
            <div className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2">
                <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={value} onValueChange={setValue}>
                <SelectTrigger
                    id={id}
                    className="mt-1 pl-9"
                    aria-invalid={hasError}
                >
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                            {role.name.charAt(0).toUpperCase() +
                                role.name.slice(1)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// Password input with visibility toggle
function PasswordInputWithIcon({
    icon: Icon,
    id,
    name,
    placeholder,
    required,
    defaultValue,
    hasError,
    ...props
}: React.ComponentProps<typeof Input> & {
    icon: React.ComponentType<{ className?: string }>;
    hasError?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
                id={id}
                name={name}
                type={showPassword ? 'text' : 'password'}
                className="pr-9 pl-9"
                placeholder={placeholder}
                required={required}
                defaultValue={defaultValue}
                aria-invalid={hasError}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
            </button>
        </div>
    );
}

// Password strength indicator
function PasswordStrength({ password }: { password: string }) {
    const getStrength = (
        pwd: string,
    ): {
        score: number;
        label: string;
        color: string;
    } => {
        if (!pwd) {
            return { score: 0, label: '', color: '' };
        }

        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^a-zA-Z\d]/.test(pwd)) score++;

        if (score <= 2) {
            return { score, label: 'Weak', color: 'bg-destructive' };
        }
        if (score <= 3) {
            return { score, label: 'Fair', color: 'bg-yellow-500' };
        }
        if (score <= 4) {
            return { score, label: 'Good', color: 'bg-blue-500' };
        }
        return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const strength = getStrength(password);

    if (!password) {
        return null;
    }

    return (
        <div className="space-y-1">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                Password strength:{' '}
                <span className="font-medium">{strength.label}</span>
            </p>
        </div>
    );
}

// Input with icon wrapper component
function InputWithIcon({
    icon: Icon,
    id,
    hasError,
    ...props
}: React.ComponentProps<typeof Input> & {
    icon: React.ComponentType<{ className?: string }>;
    hasError?: boolean;
}) {
    return (
        <div className="relative">
            <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
                id={id}
                className="pl-9"
                aria-invalid={hasError}
                {...props}
            />
        </div>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions?: Permission[];
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    roles: Role[];
}

interface UsersProps {
    users: {
        data: User[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    roles: Role[];
    filters: {
        search?: string;
    };
}

export default function UsersIndex({ users, roles, filters }: UsersProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [passwordValue, setPasswordValue] = useState('');
    const isInitialMount = useRef(true);

    // Debounced search function
    const performSearch = useCallback((search: string) => {
        router.get(
            '/users',
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['users', 'filters'],
            },
        );
    }, []);

    // Debounce search input
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(searchValue);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue, performSearch]);

    // Handle sorting changes
    useEffect(() => {
        if (isInitialMount.current) {
            return;
        }

        const sortParam =
            sorting.length > 0
                ? {
                      sort_by: sorting[0].id,
                      sort_dir: sorting[0].desc ? 'desc' : 'asc',
                  }
                : {};

        router.get(
            '/users',
            {
                search: searchValue || undefined,
                ...sortParam,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['users', 'filters'],
            },
        );
    }, [sorting, searchValue]);

    const handleEdit = useCallback((user: User) => {
        if (user?.id != null) {
            setSelectedUser(user);
            setEditOpen(true);
        }
    }, []);

    const handleDelete = useCallback(() => {
        if (!selectedUser || typeof selectedUser.id !== 'number') {
            return;
        }

        router.delete(UserController.destroy(selectedUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    `User "${selectedUser.name}" deleted successfully!`,
                );
                setDeleteOpen(false);
                setSelectedUser(null);
            },
            onError: () => {
                toast.error('Failed to delete user. Please try again.');
            },
        });
    }, [selectedUser]);

    // Memoize form props to prevent evaluation when selectedUser is invalid
    const editFormProps = useMemo(() => {
        if (!selectedUser || typeof selectedUser.id !== 'number') {
            return null;
        }
        return UserController.update.form.patch({ user: selectedUser.id });
    }, [selectedUser]);

    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                        >
                            Name
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    return (
                        <div className="font-medium">{row.original.name}</div>
                    );
                },
            },
            {
                accessorKey: 'email',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                        >
                            Email
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    return <div>{row.original.email}</div>;
                },
            },
            {
                id: 'role',
                header: 'Role',
                cell: ({ row }) => {
                    const role = row.original.roles[0];
                    const fullRole = roles.find((r) => r.id === role?.id);
                    return (
                        <div className="flex items-center gap-2">
                            {role ? (
                                <>
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                        {role.name}
                                    </span>
                                    {fullRole?.permissions &&
                                        fullRole.permissions.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    setSelectedRole(fullRole);
                                                    setPermissionsOpen(true);
                                                }}
                                                title="View permissions"
                                            >
                                                <Shield className="h-3 w-3" />
                                            </Button>
                                        )}
                                </>
                            ) : (
                                <span className="text-muted-foreground">
                                    No role
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'email_verified_at',
                header: 'Verified',
                cell: ({ row }) => {
                    return (
                        <div>
                            {row.original.email_verified_at ? (
                                <span className="text-sm text-muted-foreground">
                                    Yes
                                </span>
                            ) : (
                                <span className="text-sm text-destructive">
                                    No
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'created_at',
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                column.toggleSorting(
                                    column.getIsSorted() === 'asc',
                                )
                            }
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                        >
                            Created
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    );
                },
                cell: ({ row }) => {
                    return (
                        <div className="text-sm text-muted-foreground">
                            {new Date(
                                row.original.created_at,
                            ).toLocaleDateString()}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => {
                    const user = row.original;
                    return (
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(user)}
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteOpen(true);
                                }}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [handleEdit, roles],
    );

    const table = useReactTable({
        data: users.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        manualSorting: true,
        manualPagination: true,
        state: {
            sorting,
        },
    });

    const handleSearch = (value: string) => {
        setSearchValue(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Users</h1>
                    <Button onClick={() => setCreateOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create User
                    </Button>
                </div>

                <Alert>
                    <InfoIcon />
                    <AlertTitle>User Management</AlertTitle>
                    <AlertDescription>
                        Manage user accounts and assign roles. Only users with
                        admin role can access this page. Users can have one role
                        at a time.
                    </AlertDescription>
                </Alert>

                {/* Filters and Table Controls */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchValue}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Table */}
                {users.data.length === 0 ? (
                    <Empty>
                        <EmptyMedia>
                            <Users className="h-12 w-12" />
                        </EmptyMedia>
                        <EmptyHeader>
                            <EmptyTitle>No users found</EmptyTitle>
                            <EmptyDescription>
                                {searchValue
                                    ? 'Try adjusting your search criteria.'
                                    : 'No users have been created yet.'}
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                'selected'
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {users.from} to {users.to} of {users.total}{' '}
                            users
                        </div>
                        <Pagination>
                            <PaginationContent>
                                {users.links.map((link, index) => {
                                    if (index === 0) {
                                        return (
                                            <PaginationItem key={index}>
                                                <PaginationPrevious
                                                    href={link.url || '#'}
                                                    className={
                                                        !link.url
                                                            ? 'pointer-events-none opacity-50'
                                                            : ''
                                                    }
                                                />
                                            </PaginationItem>
                                        );
                                    }

                                    if (index === users.links.length - 1) {
                                        return (
                                            <PaginationItem key={index}>
                                                <PaginationNext
                                                    href={link.url || '#'}
                                                    className={
                                                        !link.url
                                                            ? 'pointer-events-none opacity-50'
                                                            : ''
                                                    }
                                                />
                                            </PaginationItem>
                                        );
                                    }

                                    if (link.label === '...') {
                                        return (
                                            <PaginationItem key={index}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }

                                    return (
                                        <PaginationItem key={index}>
                                            <PaginationLink
                                                href={link.url || '#'}
                                                isActive={link.active}
                                            >
                                                {link.label}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* Create User Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <Form
                            {...UserController.storeAdmin.form()}
                            noValidate
                            options={{
                                preserveScroll: true,
                            }}
                            onSuccess={() => {
                                toast.success('User created successfully!');
                                setCreateOpen(false);
                                setPasswordValue('');
                            }}
                            onError={() => {
                                toast.error(
                                    'Failed to create user. Please check the form for errors.',
                                );
                            }}
                            resetOnSuccess
                        >
                            {({ processing, errors }) => (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>Create User</DialogTitle>
                                        <DialogDescription>
                                            Create a new user account and assign
                                            a role. All fields marked with * are
                                            required.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <FieldGroup>
                                        <Field data-invalid={!!errors.name}>
                                            <FieldLabel htmlFor="create-name">
                                                Full Name *
                                            </FieldLabel>
                                            <InputWithIcon
                                                id="create-name"
                                                name="name"
                                                icon={User}
                                                placeholder="John Doe"
                                                required
                                                autoFocus
                                                hasError={!!errors.name}
                                            />
                                            <FieldError>
                                                {errors.name}
                                            </FieldError>
                                        </Field>
                                        <Field data-invalid={!!errors.email}>
                                            <FieldLabel htmlFor="create-email">
                                                Email Address *
                                            </FieldLabel>
                                            <InputWithIcon
                                                id="create-email"
                                                type="email"
                                                name="email"
                                                icon={Mail}
                                                placeholder="john.doe@example.com"
                                                required
                                                hasError={!!errors.email}
                                            />
                                            <FieldError>
                                                {errors.email}
                                            </FieldError>
                                        </Field>
                                        <Field data-invalid={!!errors.password}>
                                            <FieldLabel htmlFor="create-password">
                                                Password *
                                            </FieldLabel>
                                            <PasswordInputWithIcon
                                                id="create-password"
                                                name="password"
                                                icon={Lock}
                                                placeholder="Enter a strong password"
                                                required
                                                hasError={!!errors.password}
                                                onChange={(e) =>
                                                    setPasswordValue(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <PasswordStrength
                                                password={passwordValue}
                                            />
                                            <FieldError>
                                                {errors.password}
                                            </FieldError>
                                        </Field>
                                        <Field
                                            data-invalid={
                                                !!errors.password_confirmation
                                            }
                                        >
                                            <FieldLabel htmlFor="create-password-confirmation">
                                                Confirm Password *
                                            </FieldLabel>
                                            <PasswordInputWithIcon
                                                id="create-password-confirmation"
                                                name="password_confirmation"
                                                icon={Lock}
                                                placeholder="Re-enter the password"
                                                required
                                                hasError={
                                                    !!errors.password_confirmation
                                                }
                                            />
                                            <FieldError>
                                                {errors.password_confirmation}
                                            </FieldError>
                                        </Field>
                                        <Field data-invalid={!!errors.role}>
                                            <FieldLabel htmlFor="create-role">
                                                Role
                                            </FieldLabel>
                                            <RoleSelect
                                                id="create-role"
                                                defaultValue=""
                                                roles={roles}
                                                hasError={!!errors.role}
                                            />
                                            <FieldDescription>
                                                Select a role to assign
                                                permissions. Leave empty for no
                                                role.
                                            </FieldDescription>
                                            <FieldError>
                                                {errors.role}
                                            </FieldError>
                                        </Field>
                                    </FieldGroup>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setCreateOpen(false);
                                                setPasswordValue('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <>
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <PlusIcon className="mr-2 h-4 w-4" />
                                                    Create User
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                {editFormProps && selectedUser && (
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <Form
                                {...editFormProps}
                                noValidate
                                options={{
                                    preserveScroll: true,
                                }}
                                onSuccess={() => {
                                    toast.success(
                                        `User "${selectedUser.name}" updated successfully!`,
                                    );
                                    setEditOpen(false);
                                    setSelectedUser(null);
                                }}
                                onError={() => {
                                    toast.error(
                                        'Failed to update user. Please check the form for errors.',
                                    );
                                }}
                                resetOnSuccess
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <DialogHeader>
                                            <DialogTitle>Edit User</DialogTitle>
                                            <DialogDescription>
                                                Update user information and role
                                                assignment. Changes will take
                                                effect immediately.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <FieldGroup>
                                            <Field data-invalid={!!errors.name}>
                                                <FieldLabel htmlFor="edit-name">
                                                    Full Name *
                                                </FieldLabel>
                                                <InputWithIcon
                                                    id="edit-name"
                                                    name="name"
                                                    icon={User}
                                                    defaultValue={
                                                        selectedUser.name
                                                    }
                                                    placeholder="John Doe"
                                                    required
                                                    hasError={!!errors.name}
                                                />
                                                <FieldError>
                                                    {errors.name}
                                                </FieldError>
                                            </Field>
                                            <Field
                                                data-invalid={!!errors.email}
                                            >
                                                <FieldLabel htmlFor="edit-email">
                                                    Email Address *
                                                </FieldLabel>
                                                <InputWithIcon
                                                    id="edit-email"
                                                    type="email"
                                                    name="email"
                                                    icon={Mail}
                                                    defaultValue={
                                                        selectedUser.email
                                                    }
                                                    placeholder="john.doe@example.com"
                                                    required
                                                    hasError={!!errors.email}
                                                />
                                                <FieldError>
                                                    {errors.email}
                                                </FieldError>
                                            </Field>
                                            <Field data-invalid={!!errors.role}>
                                                <FieldLabel htmlFor="edit-role">
                                                    Role
                                                </FieldLabel>
                                                <RoleSelect
                                                    id="edit-role"
                                                    defaultValue={
                                                        selectedUser.roles[0]
                                                            ?.name || ''
                                                    }
                                                    roles={roles}
                                                    hasError={!!errors.role}
                                                />
                                                <FieldDescription>
                                                    Change the user's role to
                                                    modify their permissions.
                                                </FieldDescription>
                                                <FieldError>
                                                    {errors.role}
                                                </FieldError>
                                            </Field>
                                        </FieldGroup>
                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditOpen(false);
                                                    setSelectedUser(null);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <PencilIcon className="mr-2 h-4 w-4" />
                                                        Update User
                                                    </>
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Permissions Viewer Modal */}
                {selectedRole && (
                    <Dialog
                        open={permissionsOpen}
                        onOpenChange={setPermissionsOpen}
                    >
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>
                                    Permissions for{' '}
                                    {selectedRole.name.charAt(0).toUpperCase() +
                                        selectedRole.name.slice(1)}
                                </DialogTitle>
                                <DialogDescription>
                                    View all permissions associated with this
                                    role.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[400px] overflow-y-auto">
                                {selectedRole.permissions &&
                                selectedRole.permissions.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedRole.permissions.map(
                                            (permission) => (
                                                <div
                                                    key={permission.id}
                                                    className="flex items-center gap-2 rounded-md border p-3"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                                    <span className="text-sm font-medium">
                                                        {permission.name}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Shield className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                        <p>
                                            No permissions assigned to this
                                            role.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPermissionsOpen(false);
                                        setSelectedRole(null);
                                    }}
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Delete Confirmation Modal */}
                {selectedUser && typeof selectedUser.id === 'number' && (
                    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete{' '}
                                    <strong>{selectedUser.name}</strong>? This
                                    action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setDeleteOpen(false);
                                        setSelectedUser(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}
