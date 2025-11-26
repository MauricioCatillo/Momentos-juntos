import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Smile, LogOut, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CountdownWidget } from '../components/CountdownWidget';
import { StreaksWidget } from '../components/StreaksWidget';
import { StickyNotes } from '../components/StickyNotes';
import { getAppSettings } from '../supabaseClient';

const BentoCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    delay?: number;
}> = ({ children, className = '', delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.5, delay, type: "spring", stiffness: 300, damping: 20 }}
        className={`glass-card rounded-3xl p-5 cursor-pointer ${className}`}
    >
        {children}
    </motion.div>
);

export const Home: React.FC = () => {
    const { moods, user, logout, theme, toggleTheme } = useApp();
    const lastMood = moods[moods.length - 1]?.mood || 'neutral';
    const [settings, setSettings] = useState<any>({
        countdown: { date: new Date().toISOString(), title: 'Cargando...' },
        music: { url: 'https://open.spotify.com/embed/track/2Lhdl74nwwVGOE2Gv35QuK?utm_source=generator' }, // Default song
        streaks: { count: 0 }
    });
    const [daysTogether, setDaysTogether] = useState(0);

    useEffect(() => {
        loadSettings();
        // Calculate days together
        const startDate = new Date('2022-12-21'); // Start date for 1071 days (as of 2025-11-26)
        const today = new Date();
        setDaysTogether(differenceInDays(today, startDate));
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getAppSettings();
            // Only update if data exists, otherwise keep defaults
            if (data && Object.keys(data).length > 0) {
                setSettings((prev: any) => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const moodEmoji = {
        happy: '😊',
        sad: '😢',
        neutral: '😐',
        excited: '🤩',
        tired: '😴',
    }[lastMood] as string;

    return (
        <div className="p-6 pb-24 space-y-6">
            <header className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-1">
                        Hola, {user?.email?.split('@')[0] || 'Amor'} ❤️
                    </h1>
                    <p className="text-stone-600 dark:text-stone-400">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <StreaksWidget count={settings.streaks?.count || 0} />
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-white dark:bg-stone-800 rounded-full text-stone-400 dark:text-stone-300 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-stone-700 transition-colors shadow-sm"
                        title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button
                        onClick={logout}
                        className="p-2 bg-white dark:bg-stone-800 rounded-full text-stone-400 dark:text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-stone-700 transition-colors shadow-sm"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4">
                {/* Countdown Widget */}
                <div className="col-span-2">
                    <CountdownWidget
                        targetDate={settings.countdown?.date}
                        title={settings.countdown?.title}
                    />
                </div>

                {/* Days Together Card */}
                <div className="glass-card p-6 rounded-3xl col-span-2 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Juntos desde hace</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-stone-800 dark:text-stone-100">{daysTogether}</span>
                            <span className="text-stone-600 dark:text-stone-400">días</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-soft-blush/30 dark:bg-soft-blush/20 rounded-full flex items-center justify-center text-2xl">
                        💑
                    </div>
                </div>

                {/* Mood Card */}
                <BentoCard delay={0.1} className="flex flex-col justify-between bg-gradient-to-br from-white/60 to-rose-50/60 dark:from-stone-800/60 dark:to-stone-900/60">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/50 dark:bg-stone-700/50 rounded-full w-fit backdrop-blur-sm">
                            <Smile size={20} className="text-stone-600 dark:text-stone-300" />
                        </div>
                    </div>
                    <div>
                        <p className="text-stone-500 dark:text-stone-400 text-xs mb-1 font-medium uppercase">Mood Actual</p>
                        <p className="text-4xl filter drop-shadow-sm">{moodEmoji}</p>
                    </div>
                </BentoCard>

                {/* Next Date Card */}
                <div className="glass-card p-6 rounded-3xl col-span-1 flex flex-col justify-between">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Próxima Cita</p>
                        <p className="font-bold text-stone-800 dark:text-stone-100 leading-tight">Cena en la playa</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Viernes, 8:00 PM</p>
                    </div>
                </div>

                {/* Sticky Notes */}
                <div className="col-span-2 mt-4">
                    <StickyNotes />
                </div>
            </div>
        </div>
    );
};
