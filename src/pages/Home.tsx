import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Smile, LogOut, X, Pencil, Sparkles, ChevronRight, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CountdownWidget } from '../components/CountdownWidget';
import { StreaksWidget } from '../components/StreaksWidget';
import { StickyNotes } from '../components/StickyNotes';
import { getAppSettings, updateAppSetting } from '../supabaseClient';
import { ErrorBoundary } from '../components/ErrorBoundary';

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

interface NextDateData {
    title: string;
    description: string;
    datetime: string;
}

export const Home: React.FC = () => {
    const { moods, user, logout } = useApp();
    const navigate = useNavigate();
    const lastMood = moods[moods.length - 1]?.mood || 'neutral';
    const [settings, setSettings] = useState<{
        countdown: { date: string; title: string };
        music: { url: string };
        streaks: { count: number };
    }>({
        countdown: { date: new Date().toISOString(), title: 'Cargando...' },
        music: { url: 'https://open.spotify.com/embed/track/2Lhdl74nwwVGOE2Gv35QuK?utm_source=generator' },
        streaks: { count: 0 }
    });
    const [nextDate, setNextDate] = useState<NextDateData>({
        title: 'Sin cita planificada',
        description: '',
        datetime: ''
    });
    const [daysTogether] = useState(() => {
        const startDate = new Date('2022-12-21');
        const today = new Date();
        return differenceInDays(today, startDate);
    });

    // Modal states
    const [showCountdownModal, setShowCountdownModal] = useState(false);
    const [showNextDateModal, setShowNextDateModal] = useState(false);
    const [countdownForm, setCountdownForm] = useState({ title: '', date: '' });
    const [nextDateForm, setNextDateForm] = useState({ title: '', description: '', datetime: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getAppSettings();
                if (data && Object.keys(data).length > 0) {
                    setSettings((prev: typeof settings) => ({ ...prev, ...data }));

                    // Load next_date if exists
                    if (data.next_date) {
                        setNextDate(data.next_date);
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };

        loadSettings();
    }, []);

    const handleCountdownEdit = () => {
        setCountdownForm({
            title: settings.countdown?.title || '',
            date: settings.countdown?.date ? settings.countdown.date.split('T')[0] : ''
        });
        setShowCountdownModal(true);
    };

    const handleCountdownSave = async () => {
        setSaving(true);
        try {
            const newCountdown = {
                title: countdownForm.title,
                date: new Date(countdownForm.date).toISOString()
            };
            await updateAppSetting('countdown', newCountdown);
            setSettings(prev => ({ ...prev, countdown: newCountdown }));
            setShowCountdownModal(false);
        } catch (error) {
            console.error('Error saving countdown:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleNextDateEdit = () => {
        setNextDateForm({
            title: nextDate.title || '',
            description: nextDate.description || '',
            datetime: nextDate.datetime || ''
        });
        setShowNextDateModal(true);
    };

    const handleNextDateSave = async () => {
        setSaving(true);
        try {
            const newNextDate = {
                title: nextDateForm.title,
                description: nextDateForm.description,
                datetime: nextDateForm.datetime
            };
            await updateAppSetting('next_date', newNextDate);
            setNextDate(newNextDate);
            setShowNextDateModal(false);
        } catch (error) {
            console.error('Error saving next date:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatNextDateDisplay = () => {
        if (!nextDate.datetime) return '';
        try {
            const date = new Date(nextDate.datetime);
            return format(date, "EEEE, h:mm a", { locale: es });
        } catch {
            return nextDate.datetime;
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
                    <ErrorBoundary fallback={<div className="w-8 h-8 bg-stone-100 rounded-full" />}>
                        <StreaksWidget count={settings.streaks?.count || 0} />
                    </ErrorBoundary>

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
                    <ErrorBoundary>
                        <CountdownWidget
                            targetDate={settings.countdown?.date}
                            title={settings.countdown?.title}
                            onEdit={handleCountdownEdit}
                        />
                    </ErrorBoundary>
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

                {/* Next Date Card - Now Dynamic and Editable */}
                <div
                    className="glass-card p-6 rounded-3xl col-span-1 flex flex-col justify-between cursor-pointer group relative"
                    onClick={handleNextDateEdit}
                >
                    {/* Edit icon - visible on mobile, hover on desktop */}
                    <div className="absolute top-2 right-2 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <div className="p-2 bg-white/80 dark:bg-stone-700/80 rounded-full backdrop-blur-sm shadow-sm min-w-[36px] min-h-[36px] flex items-center justify-center">
                            <Pencil size={14} className="text-stone-600 dark:text-stone-300" />
                        </div>
                    </div>

                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Próxima Cita</p>
                        <p className="font-bold text-stone-800 dark:text-stone-100 leading-tight">{nextDate.title || 'Sin planificar'}</p>
                        {nextDate.datetime && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 capitalize">{formatNextDateDisplay()}</p>
                        )}
                    </div>
                </div>

                {/* Wishlist Widget */}
                <BentoCard
                    delay={0.2}
                    className="col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between group"
                >
                    <div onClick={() => navigate('/wishlist')} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                <Sparkles size={24} className="text-yellow-300" />
                            </div>
                            <div>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-0.5">Nuestros Sueños</p>
                                <h3 className="text-xl font-bold text-white">Lista de Deseos</h3>
                            </div>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                            <ChevronRight size={24} />
                        </div>
                    </div>
                </BentoCard>

                {/* Gallery Widget */}
                <BentoCard
                    delay={0.3}
                    className="col-span-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between group"
                >
                    <div onClick={() => navigate('/gallery')} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                <Image size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-0.5">Nuestra Historia</p>
                                <h3 className="text-xl font-bold text-white">Galería de Fotos</h3>
                            </div>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                            <ChevronRight size={24} />
                        </div>
                    </div>
                </BentoCard>

                {/* Sticky Notes */}
                <div className="col-span-2 mt-4">
                    <ErrorBoundary>
                        <StickyNotes showPushNotification={true} />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Countdown Edit Modal */}
            <AnimatePresence>
                {showCountdownModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowCountdownModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Editar Nuestro Gran Día</h3>
                                <button
                                    onClick={() => setShowCountdownModal(false)}
                                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-stone-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Título
                                    </label>
                                    <input
                                        type="text"
                                        value={countdownForm.title}
                                        onChange={(e) => setCountdownForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                        placeholder="Ej: Nuestro Gran Día"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Fecha
                                    </label>
                                    <input
                                        type="date"
                                        value={countdownForm.date}
                                        onChange={(e) => setCountdownForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCountdownModal(false)}
                                    className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCountdownSave}
                                    disabled={saving || !countdownForm.title || !countdownForm.date}
                                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Next Date Edit Modal */}
            <AnimatePresence>
                {showNextDateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowNextDateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Editar Próxima Cita</h3>
                                <button
                                    onClick={() => setShowNextDateModal(false)}
                                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-stone-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Título
                                    </label>
                                    <input
                                        type="text"
                                        value={nextDateForm.title}
                                        onChange={(e) => setNextDateForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Ej: Cena romántica"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Descripción (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={nextDateForm.description}
                                        onChange={(e) => setNextDateForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="Ej: En la playa"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                                        Fecha y Hora
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={nextDateForm.datetime}
                                        onChange={(e) => setNextDateForm(prev => ({ ...prev, datetime: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowNextDateModal(false)}
                                    className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNextDateSave}
                                    disabled={saving || !nextDateForm.title}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

