import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { logout } from '@/routes';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, Loader2, LogOut, ShieldAlert } from 'lucide-react';
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

            <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-muted/40 p-4 py-12 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="w-full max-w-md"
                >
                    <Card className="border-border/50 shadow-lg">
                        <CardHeader className="pb-2 text-center sm:text-left">
                            <motion.div variants={itemVariants}>
                                <CardTitle className="text-xl">
                                    Account Under Review
                                </CardTitle>
                                <CardDescription>
                                    We are currently verifying your registration
                                    details.
                                </CardDescription>
                            </motion.div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                {/* Completed Step */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex items-start gap-3 px-4 py-2 opacity-50"
                                >
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div className="space-y-1">
                                        <p className="text-sm leading-none font-medium">
                                            Account Created
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Your email has been confirmed.
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Active Step */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-4"
                                >
                                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 animate-pulse text-primary" />
                                    <div className="space-y-1">
                                        <p className="text-sm leading-none font-medium text-primary">
                                            Admin Review
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Waiting for role assignment.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 border-t bg-muted/10 p-6">
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
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </>
    );
}
