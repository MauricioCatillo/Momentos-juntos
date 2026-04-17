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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--bg-from)] via-[var(--bg-from)]/85 to-transparent" />

            <div className="relative px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <div className="pointer-events-auto rounded-[1.85rem] border border-white/[0.08] bg-[var(--surface-1)]/80 p-2 shadow-[0_22px_48px_rgba(0,0,0,0.2)] backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[rgba(18,14,24,0.88)]">
                    <div className="grid grid-cols-4 gap-1.5">
                        {navItems.map(({ path, icon: Icon, label, match }) => {
                            const isActive = match.includes(location.pathname);

                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => trigger('light')}
                                    className={cn(
                                        'relative flex min-h-[3.55rem] flex-col items-center justify-center rounded-2xl px-1 text-center transition-all duration-300',
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
                                                className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[color:var(--accent)]/12 via-[color:var(--accent)]/6 to-transparent dark:from-[color:var(--accent)]/15 dark:via-[color:var(--accent)]/8 dark:to-transparent"
                                            />
                                        )}

                                        <div className="relative z-10 flex flex-col items-center gap-1.5">
                                            <Icon size={19} strokeWidth={2.2} />
                                            <span
                                                className={cn(
                                                    'text-[0.62rem] font-semibold tracking-[0.14em] uppercase',
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
