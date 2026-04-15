import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, PanelsTopLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';

const navItems = [
    { path: '/', icon: Home, label: 'Inicio', match: ['/'] },
    { path: '/chat', icon: MessageCircle, label: 'Chat', match: ['/chat'] },
    { path: '/memories', icon: Heart, label: 'Recuerdos', match: ['/memories', '/story', '/gallery'] },
    { path: '/more', icon: PanelsTopLeft, label: 'Mas', match: ['/more', '/daily', '/wishlist'] },
];

export const BottomNav: React.FC = () => {
    const { trigger } = useHaptic();
    const location = useLocation();

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--bg-from)] via-[var(--bg-from)]/82 to-transparent" />

            <div className="relative px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <div className="pointer-events-auto rounded-[1.9rem] border border-white/[0.1] bg-[var(--surface-1)]/88 p-2 shadow-[0_22px_48px_rgba(56,31,20,0.18)] backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[rgba(24,19,18,0.9)]">
                    <div className="mb-1 flex items-center justify-center">
                        <div className="h-1 w-10 rounded-full bg-[color:var(--border-strong)]" />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                        {navItems.map(({ path, icon: Icon, label, match }) => {
                            const isActive = match.includes(location.pathname);

                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => trigger('light')}
                                    className={cn(
                                        'relative flex min-h-[3.65rem] flex-col items-center justify-center rounded-2xl px-1 text-center transition-all duration-300',
                                        isActive
                                            ? 'text-[color:var(--accent)]'
                                            : 'text-[color:var(--text-tertiary)]'
                                    )}
                                >
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="bottom-nav-active"
                                                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                                className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[color:var(--accent)]/18 via-[color:var(--accent)]/8 to-transparent dark:from-[color:var(--accent)]/16 dark:via-[color:var(--accent)]/7 dark:to-transparent"
                                            />
                                        )}

                                        <div className="relative z-10 flex flex-col items-center gap-1.5">
                                            <div className={cn(
                                                'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300',
                                                isActive ? 'bg-white/65 dark:bg-white/10' : 'bg-transparent'
                                            )}>
                                                <Icon size={18} strokeWidth={2.2} />
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-[0.58rem] font-semibold tracking-[0.16em] uppercase',
                                                    isActive ? 'opacity-100' : 'opacity-70'
                                                )}
                                            >
                                                {label}
                                            </span>

                                            {isActive && (
                                                <motion.div
                                                    layoutId="bottom-nav-dot"
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                    className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[color:var(--accent)] shadow-[0_0_6px_var(--accent)]"
                                                />
                                            )}
                                        </div>
                                    </>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
