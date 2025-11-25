import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Calendar, Gamepad2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/story', icon: Heart, label: 'Historia' },
    { path: '/daily', icon: Calendar, label: 'Diario' },
    { path: '/future', icon: Gamepad2, label: 'Futuro' },
];

export const BottomNav: React.FC = () => {
    return (
        <div className="w-full px-6 pb-6 pt-2 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-sm">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-full shadow-lg shadow-stone-200/50 py-2 px-6 flex justify-between items-center">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center p-2 transition-all duration-300 relative group",
                                isActive ? "text-soft-blush scale-110" : "text-stone-400 hover:text-stone-600 hover:scale-105"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className="relative">
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-soft-blush rounded-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </div>
                                <span className={cn("text-[10px] font-medium mt-1 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
};
