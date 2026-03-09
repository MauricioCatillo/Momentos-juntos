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
        {icon && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/8 shadow-sm backdrop-blur-md dark:bg-white/5">{icon}</div>}
        <p className={cn('display-font text-[2rem] font-semibold leading-none text-[color:var(--text-primary)]', icon && 'mt-5')}>
            {title}
        </p>
        {description && (
            <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                {description}
            </p>
        )}
    </div>
);
