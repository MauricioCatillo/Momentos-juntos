import React from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    className,
}) => (
    <div className={cn('section-card rounded-[1.8rem] px-5 py-10 text-center', className)}>
        {icon && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/70 shadow-sm dark:bg-white/6">{icon}</div>}
        <p className={cn('display-font text-[2rem] leading-none text-stone-900 dark:text-stone-100', icon && 'mt-5')}>
            {title}
        </p>
        {description && (
            <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">
                {description}
            </p>
        )}
    </div>
);
