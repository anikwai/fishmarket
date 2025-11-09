import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
    iconNode?: LucideIcon | null;
    className?: string;
}

export function Icon({ iconNode: IconComponent, className }: IconProps) {
    if (!IconComponent) {
        return null;
    }

    return (
        <IconComponent 
            className={cn('text-muted-foreground', className)} 
        />
    );
}
