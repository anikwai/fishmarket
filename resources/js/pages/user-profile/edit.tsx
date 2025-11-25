import UserProfileController from '@/actions/App/Http/Controllers/UserProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import userProfile from '@/routes/user-profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: userProfile.edit().url,
    },
];

export default function Edit({ status }: { status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Manage your personal information and account settings"
                    />

                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-16">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="text-lg">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <CardTitle>{auth.user.name}</CardTitle>
                                        <CardDescription>
                                            {auth.user.email}
                                        </CardDescription>
                                        {auth.user.avatar && (
                                            <Badge
                                                variant="secondary"
                                                className="mt-1"
                                            >
                                                Google Account
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <Form
                                {...UserProfileController.update.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                className="space-y-6"
                            >
                                {({
                                    processing,
                                    recentlySuccessful,
                                    errors,
                                }) => (
                                    <>
                                        <div className="space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">
                                                    Full name
                                                </Label>

                                                <Input
                                                    id="name"
                                                    className="mt-1 block w-full"
                                                    defaultValue={
                                                        auth.user.name
                                                    }
                                                    name="name"
                                                    required
                                                    autoComplete="name"
                                                    placeholder="Enter your full name"
                                                />

                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="email">
                                                    Email address
                                                </Label>

                                                <Input
                                                    id="email"
                                                    type="email"
                                                    className="mt-1 block w-full"
                                                    defaultValue={
                                                        auth.user.email
                                                    }
                                                    name="email"
                                                    required
                                                    autoComplete="username"
                                                    placeholder="Enter your email address"
                                                />

                                                <InputError
                                                    message={errors.email}
                                                />
                                            </div>

                                            {auth.user.email_verified_at ===
                                                null && (
                                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/20">
                                                    <p className="text-sm text-muted-foreground">
                                                        Your email address is
                                                        unverified.{' '}
                                                        <Link
                                                            href={send()}
                                                            as="button"
                                                            className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                        >
                                                            Click here to resend
                                                            the verification
                                                            email.
                                                        </Link>
                                                    </p>

                                                    {status ===
                                                        'verification-link-sent' && (
                                                        <div className="mt-2 text-sm font-medium text-green-600">
                                                            A new verification
                                                            link has been sent
                                                            to your email
                                                            address.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between border-t pt-4">
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    disabled={processing}
                                                    data-test="update-profile-button"
                                                >
                                                    Save changes
                                                </Button>

                                                <Transition
                                                    show={recentlySuccessful}
                                                    enter="transition ease-in-out"
                                                    enterFrom="opacity-0"
                                                    leave="transition ease-in-out"
                                                    leaveTo="opacity-0"
                                                >
                                                    <p className="text-sm text-green-600">
                                                        Profile updated
                                                        successfully
                                                    </p>
                                                </Transition>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>

                    <DeleteUser />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
