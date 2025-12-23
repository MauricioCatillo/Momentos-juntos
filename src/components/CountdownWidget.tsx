import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Heart, Pencil } from 'lucide-react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

interface CountdownProps {
    targetDate: string;
    title: string;
    onEdit?: () => void;
}

export const CountdownWidget: React.FC<CountdownProps> = ({ targetDate, title, onEdit }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const target = new Date(targetDate);

            setTimeLeft({
                days: differenceInDays(target, now),
                hours: differenceInHours(target, now) % 24,
                minutes: differenceInMinutes(target, now) % 60,
                seconds: differenceInSeconds(target, now) % 60
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <motion.div
            className="glass-card rounded-3xl p-6 relative overflow-hidden cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            onClick={onEdit}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Heart size={100} className="text-rose-500" />
            </div>

            {/* Edit icon - appears on hover */}
            {onEdit && (
                <div className="absolute top-3 right-3 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <div className="p-2 bg-white/80 dark:bg-stone-700/80 rounded-full backdrop-blur-sm shadow-sm">
                        <Pencil size={16} className="text-stone-600 dark:text-stone-300" />
                    </div>
                </div>
            )}

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-stone-600 dark:text-stone-400">
                    <Clock size={18} />
                    <span className="text-sm font-medium uppercase tracking-wider break-words">{title}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/40 dark:bg-stone-900/40 rounded-xl p-2 backdrop-blur-sm">
                        <span className="block text-2xl font-bold text-stone-800 dark:text-stone-100">{timeLeft.days}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Días</span>
                    </div>
                    <div className="bg-white/40 dark:bg-stone-900/40 rounded-xl p-2 backdrop-blur-sm">
                        <span className="block text-2xl font-bold text-stone-800 dark:text-stone-100">{timeLeft.hours}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Hrs</span>
                    </div>
                    <div className="bg-white/40 dark:bg-stone-900/40 rounded-xl p-2 backdrop-blur-sm">
                        <span className="block text-2xl font-bold text-stone-800 dark:text-stone-100">{timeLeft.minutes}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Min</span>
                    </div>
                    <div className="bg-white/40 dark:bg-stone-900/40 rounded-xl p-2 backdrop-blur-sm relative overflow-hidden">
                        <AnimatePresence mode='popLayout'>
                            <motion.span
                                key={timeLeft.seconds}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="block text-2xl font-bold text-stone-800 dark:text-stone-100"
                            >
                                {timeLeft.seconds}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-xs text-stone-500 dark:text-stone-400">Seg</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

