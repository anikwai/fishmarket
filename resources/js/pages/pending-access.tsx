import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Shield } from 'lucide-react';

export default function PendingAccess() {
    return (
        <AuthLayout
            title="Access Pending"
            description="Your account is awaiting approval"
        >
            <Head title="Access Pending" />
            <div className="space-y-6">
                <Alert
                    variant="default"
                    className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
                >
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle className="text-yellow-800 dark:text-yellow-200">
                        Account Verification Required
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                        Your account has been created successfully, but you need
                        to be assigned a role by an administrator before you can
                        access the system.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4 rounded-lg border bg-card p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-muted p-3">
                            <Shield className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">
                                What happens next?
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                An administrator will review your account and
                                assign you an appropriate role with the
                                necessary permissions.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            • You will receive an email notification once your
                            account has been approved
                        </p>
                        <p>
                            • After approval, you'll be able to access all
                            features based on your assigned role
                        </p>
                        <p>
                            • If you have any questions, please contact your
                            system administrator
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <Link href={logout()} method="post" as="button">
                        <Button variant="outline">Sign Out</Button>
                    </Link>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="default"
                    >
                        Check Status
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
