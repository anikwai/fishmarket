'use client';

import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface FlashProps {
    success?: string;
    error?: string;
}

export default function FlashToastHandler() {
    const { flash, errors } = usePage<{
        flash?: FlashProps;
        errors?: Record<string, string>;
    }>().props;
    const shownFlashRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Show success toast only once per unique message
        if (
            flash?.success &&
            !shownFlashRef.current.has(`success:${flash.success}`)
        ) {
            toast.success(flash.success);
            shownFlashRef.current.add(`success:${flash.success}`);
            // Clear the ref after a delay to allow same message to show again if needed
            setTimeout(() => {
                shownFlashRef.current.delete(`success:${flash.success}`);
            }, 1000);
        }

        // Show error toast only once per unique message
        if (
            flash?.error &&
            !shownFlashRef.current.has(`error:${flash.error}`)
        ) {
            toast.error(flash.error);
            shownFlashRef.current.add(`error:${flash.error}`);
            setTimeout(() => {
                shownFlashRef.current.delete(`error:${flash.error}`);
            }, 1000);
        }
    }, [flash]);

    // Handle validation errors - show first error as toast
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            const firstErrorKey = Object.keys(errors)[0];
            const firstError = errors[firstErrorKey];
            const errorMessage = Array.isArray(firstError)
                ? firstError[0]
                : firstError;
            if (
                errorMessage &&
                typeof errorMessage === 'string' &&
                !shownFlashRef.current.has(`validation:${errorMessage}`)
            ) {
                toast.error(errorMessage);
                shownFlashRef.current.add(`validation:${errorMessage}`);
                setTimeout(() => {
                    shownFlashRef.current.delete(`validation:${errorMessage}`);
                }, 1000);
            }
        }
    }, [errors]);

    return null;
}
