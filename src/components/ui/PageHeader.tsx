import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
    title: string;
    kicker?: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    kicker,
    subtitle,
    action,
    className,
}) => {
    if (action) {
        return (
            <header className={cn('page-header', className)}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {kicker && <p className="page-kicker">{kicker}</p>}
                        <h1 className="page-title mt-1">{title}</h1>
                        {subtitle && <p className="page-subtitle mt-2">{subtitle}</p>}
                    </div>
                    {action}
                </div>
            </header>
        );
    }

    return (
        <header className={cn('page-header', className)}>
            {kicker && <p className="page-kicker">{kicker}</p>}
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </header>
    );
};
