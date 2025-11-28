import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { logout } from '@/routes';
import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    HelpCircle,
    Loader2,
    LogOut,
    Mail,
    ShieldAlert,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export default function PendingAccess() {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckStatus = () => {
        setIsLoading(true);
        router.reload({
            onFinish: () => setIsLoading(false),
        });
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: 'easeOut' as const,
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    return (
        <>
            <Head title="Access Pending" />

            <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted/30 p-4 py-12 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="w-full max-w-lg"
                >
                    <Card className="border-border/50 shadow-xl">
                        <CardHeader className="space-y-3 pb-4">
                            <div className="flex items-start justify-between">
                                <motion.div
                                    variants={itemVariants}
                                    className="space-y-1.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-2xl">
                                            Account Under Review
                                        </CardTitle>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs text-sm">
                                                    Your account is being
                                                    reviewed by our admin team.
                                                    You'll receive access once a
                                                    role is assigned.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <CardDescription>
                                        We are currently verifying your
                                        registration details and will assign
                                        appropriate access permissions.
                                    </CardDescription>
                                </motion.div>
                            </div>

                            {/* Progress Bar */}
                            <motion.div
                                variants={itemVariants}
                                className="space-y-2 pt-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Progress
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        50% Complete
                                    </Badge>
                                </div>
                                <Progress value={50} className="h-2" />
                            </motion.div>
                        </CardHeader>

                        <Separator />

                        <CardContent className="space-y-6 pt-6">
                            {/* Info Alert */}
                            <motion.div variants={itemVariants}>
                                <Alert>
                                    <Clock className="h-4 w-4" />
                                    <AlertTitle>
                                        Estimated Review Time
                                    </AlertTitle>
                                    <AlertDescription>
                                        Most accounts are reviewed within 24-48
                                        hours during business days.
                                    </AlertDescription>
                                </Alert>
                            </motion.div>

                            {/* Steps Progress */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">
                                    Account Setup Status
                                </h4>

                                {/* Completed Step */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-950/20"
                                >
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm leading-tight font-medium">
                                                Account Created
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                                            >
                                                Completed
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Your email has been confirmed
                                            successfully.
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Active Step */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex items-start gap-3 rounded-lg border-2 border-primary/50 bg-primary/5 p-3"
                                >
                                    <div className="relative mt-0.5">
                                        <ShieldAlert className="h-5 w-5 shrink-0 animate-pulse text-primary" />
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                        </span>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm leading-tight font-medium text-primary">
                                                Admin Review
                                            </p>
                                            <Badge
                                                variant="default"
                                                className="animate-pulse"
                                            >
                                                In Progress
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Waiting for role assignment by
                                            administrator.
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Pending Step */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex items-start gap-3 rounded-lg border border-dashed p-3 opacity-60"
                                >
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm leading-tight font-medium text-muted-foreground">
                                                Access Granted
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className="text-muted-foreground"
                                            >
                                                Pending
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            You'll gain full access to the
                                            platform.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </CardContent>

                        <Separator />

                        <CardFooter className="flex flex-col gap-4 bg-muted/10 p-6">
                            <motion.div
                                variants={itemVariants}
                                className="w-full space-y-3"
                            >
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleCheckStatus}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        'Check Status'
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                    asChild
                                >
                                    <Link
                                        href={logout()}
                                        method="post"
                                        as="button"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </Link>
                                </Button>
                            </motion.div>

                            {/* Help Section */}
                            <motion.div
                                variants={itemVariants}
                                className="w-full space-y-2 rounded-lg border bg-background p-4"
                            >
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-medium">
                                        Need Help?
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    If you've been waiting for more than 48
                                    hours or have questions, please contact our
                                    support team at{' '}
                                    <a
                                        href="mailto:sales@tzholdings.ltd"
                                        className="font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                        sales@tzholdings.ltd
                                    </a>
                                </p>
                            </motion.div>
                        </CardFooter>
                    </Card>

                    {/* Footer note */}
                    <motion.p
                        variants={itemVariants}
                        className="mt-4 text-center text-xs text-muted-foreground"
                    >
                        Your account information is secure and will only be used
                        for verification purposes.
                    </motion.p>
                </motion.div>
            </div>
        </>
    );
}
