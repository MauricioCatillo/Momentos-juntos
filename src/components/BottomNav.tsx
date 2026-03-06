import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Calendar, Image, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';

const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/story', icon: Heart, label: 'Historia' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/daily', icon: Calendar, label: 'Diario' },
    { path: '/gallery', icon: Image, label: 'Galeria' },
];

export const BottomNav: React.FC = () => {
    const { trigger } = useHaptic();

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(252,246,244,0.98)] via-[rgba(252,246,244,0.85)] to-transparent dark:from-[rgba(18,15,21,0.98)] dark:via-[rgba(18,15,21,0.82)]" />

            <div className="relative px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                <div className="pointer-events-auto rounded-[1.85rem] border border-white/70 bg-white/72 p-2 shadow-[0_22px_48px_rgba(83,43,57,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(28,23,30,0.9)]">
                    <div className="grid grid-cols-5 gap-1.5">
                        {navItems.map(({ path, icon: Icon, label }) => (
                            <NavLink
                                key={path}
                                to={path}
                                onClick={() => trigger('light')}
                                className={({ isActive }) =>
                                    cn(
                                        'relative flex min-h-[3.55rem] flex-col items-center justify-center rounded-2xl px-1 text-center transition-all duration-300',
                                        isActive ? 'text-rose-700 dark:text-rose-200' : 'text-stone-500 dark:text-stone-400'
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="bottom-nav-active"
                                                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                                className="absolute inset-0 rounded-2xl bg-gradient-to-b from-rose-100 via-white to-rose-50/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:from-rose-500/28 dark:via-rose-500/14 dark:to-transparent"
                                            />
                                        )}

                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                            <Icon size={19} strokeWidth={2.2} />
                                            <span
                                                className={cn(
                                                    'text-[0.62rem] font-semibold tracking-[0.14em] uppercase',
                                                    isActive ? 'opacity-100' : 'opacity-80'
                                                )}
                                            >
                                                {label}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
