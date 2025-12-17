import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Calendar, Gamepad2, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';

const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/story', icon: Heart, label: 'Historia' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/daily', icon: Calendar, label: 'Diario' },
    { path: '/future', icon: Gamepad2, label: 'Futuro' },
];

export const BottomNav: React.FC = () => {
    const { trigger } = useHaptic();

    return (
        <div
            className="w-full fixed bottom-0 left-0 z-50 pointer-events-none"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="w-full px-4 pb-4 pt-2 bg-gradient-to-t from-white/95 via-white/90 to-transparent dark:from-stone-900/95 dark:via-stone-900/90 pointer-events-auto">
                <div className="bg-white/95 dark:bg-stone-800/95 backdrop-blur-xl border border-white/50 dark:border-stone-700/50 rounded-2xl shadow-2xl shadow-stone-300/50 dark:shadow-none py-3 px-2 flex justify-around items-center max-w-md mx-auto">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            onClick={() => trigger('light')}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center justify-center p-1 transition-all duration-300 relative group min-w-[3.5rem]",
                                    isActive ? "text-rose-600 dark:text-rose-400 scale-105" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="relative">
                                        <Icon size={24} strokeWidth={2} />
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-indicator"
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-600 rounded-full"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-bold mt-1 tracking-wide",
                                        isActive ? "opacity-100" : "opacity-70"
                                    )}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

