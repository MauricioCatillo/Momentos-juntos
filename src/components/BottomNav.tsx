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
        <div
            className="w-full fixed bottom-0 left-0 z-50 pointer-events-none"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="w-full px-4 pb-4 pt-2 bg-gradient-to-t from-white/95 via-white/85 to-transparent dark:from-stone-950/95 dark:via-stone-950/80 pointer-events-auto">
                <div className="max-w-md mx-auto rounded-[1.4rem] soft-panel backdrop-blur-xl p-2.5 border border-white/60 dark:border-white/10">
                    <div className="grid grid-cols-5 gap-1.5">
                        {navItems.map(({ path, icon: Icon, label }) => (
                            <NavLink
                                key={path}
                                to={path}
                                onClick={() => trigger('light')}
                                className={({ isActive }) =>
                                    cn(
                                        'relative flex flex-col items-center justify-center py-2 rounded-xl min-h-[54px] transition-all duration-300',
                                        isActive ? 'text-rose-700 dark:text-rose-300' : 'text-stone-500 dark:text-stone-400'
                                    )
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="bottom-nav-active"
                                                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                                className="absolute inset-0 rounded-xl bg-gradient-to-b from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-900/20 border border-rose-200/70 dark:border-rose-500/30"
                                            />
                                        )}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <Icon size={20} strokeWidth={2.2} />
                                            <span className={cn('text-[10px] font-semibold mt-1 tracking-wide', isActive ? 'opacity-100' : 'opacity-85')}>
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
