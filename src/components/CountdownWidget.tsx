import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock3, Pencil } from 'lucide-react';
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

            if (Number.isNaN(target.getTime())) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.max(0, differenceInDays(target, now)),
                hours: Math.max(0, differenceInHours(target, now) % 24),
                minutes: Math.max(0, differenceInMinutes(target, now) % 60),
                seconds: Math.max(0, differenceInSeconds(target, now) % 60),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={onEdit}
            className="section-card relative w-full overflow-hidden rounded-[2rem] p-5 text-left"
        >
            <div className="absolute right-[-1.8rem] top-[-1.8rem] h-28 w-28 rounded-full bg-rose-300/25 blur-3xl" />
            <div className="absolute bottom-[-2rem] left-[-1rem] h-24 w-24 rounded-full bg-amber-200/20 blur-3xl" />

            {onEdit && (
                <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-stone-500 shadow-sm dark:bg-white/8 dark:text-stone-300">
                    <Pencil size={16} />
                </div>
            )}

            <div className="relative z-10">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-200">
                        <Clock3 size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="section-label">Cuenta regresiva</p>
                        <h3 className="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-[1.3rem] bg-white/70 p-3 text-center shadow-sm dark:bg-white/6">
                        <span className="block text-2xl font-black text-stone-900 dark:text-stone-100">{timeLeft.days}</span>
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Dias</span>
                    </div>
                    <div className="rounded-[1.3rem] bg-white/70 p-3 text-center shadow-sm dark:bg-white/6">
                        <span className="block text-2xl font-black text-stone-900 dark:text-stone-100">{timeLeft.hours}</span>
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Horas</span>
                    </div>
                    <div className="rounded-[1.3rem] bg-white/70 p-3 text-center shadow-sm dark:bg-white/6">
                        <span className="block text-2xl font-black text-stone-900 dark:text-stone-100">{timeLeft.minutes}</span>
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Min</span>
                    </div>
                    <div className="relative overflow-hidden rounded-[1.3rem] bg-white/70 p-3 text-center shadow-sm dark:bg-white/6">
                        <AnimatePresence mode="popLayout">
                            <motion.span
                                key={timeLeft.seconds}
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -12, opacity: 0 }}
                                className="block text-2xl font-black text-stone-900 dark:text-stone-100"
                            >
                                {timeLeft.seconds}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">Seg</span>
                    </div>
                </div>
            </div>
        </motion.button>
    );
};
