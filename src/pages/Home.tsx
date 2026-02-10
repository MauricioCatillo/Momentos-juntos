import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ListTodo, Image as ImageIcon, LogOut, X, Clock3, Smile, HeartHandshake, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CountdownWidget } from '../components/CountdownWidget';
import { StreaksWidget } from '../components/StreaksWidget';
import { StickyNotes } from '../components/StickyNotes';
import { getAppSettings, updateAppSetting } from '../supabaseClient';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface NextDateData {
    title: string;
    description: string;
    datetime: string;
}

interface HomeSettings {
    countdown: { date: string; title: string };
    streaks: { count: number };
}

const ActionCard = ({ title, subtitle, onClick, icon: Icon, gradient }: { title: string; subtitle: string; onClick: () => void; icon: React.ComponentType<{ size?: number }>; gradient: string; }) => (
    <motion.button
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-2xl p-4 text-left text-white ${gradient}`}
    >
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/15 blur-xl" />
        <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Icon size={20} />
            </div>
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>
        </div>
    </motion.button>
);

export const Home: React.FC = () => {
    const { moods, user, logout } = useApp();
    const navigate = useNavigate();

    const [settings, setSettings] = useState<HomeSettings>({
        countdown: { date: new Date().toISOString(), title: 'Cargando...' },
        streaks: { count: 0 },
    });

    const [nextDate, setNextDate] = useState<NextDateData>({
        title: 'Sin cita planificada',
        description: '',
        datetime: '',
    });

    const [showCountdownModal, setShowCountdownModal] = useState(false);
    const [showNextDateModal, setShowNextDateModal] = useState(false);
    const [countdownForm, setCountdownForm] = useState({ title: '', date: '' });
    const [nextDateForm, setNextDateForm] = useState({ title: '', description: '', datetime: '' });
    const [saving, setSaving] = useState(false);

    const daysTogether = useMemo(() => {
        const startDate = new Date('2022-12-21');
        return differenceInDays(new Date(), startDate);
    }, []);

    const todayMood = useMemo(
        () => moods.find((m) => new Date(m.date).toDateString() === new Date().toDateString()),
        [moods]
    );

    const moodLabel = useMemo(() => {
        const map: Record<string, string> = {
            happy: 'Feliz',
            excited: 'Emocionado',
            neutral: 'Normal',
            tired: 'Cansado',
            sad: 'Triste',
        };

        if (!todayMood) return 'Sin check-in';
        return map[todayMood.mood] || 'Sin check-in';
    }, [todayMood]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await getAppSettings();
                if (!data || Object.keys(data).length === 0) return;

                setSettings((prev) => ({ ...prev, ...data }));
                if (data.next_date) setNextDate(data.next_date as NextDateData);
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };

        void loadSettings();
    }, []);

    const handleCountdownEdit = () => {
        setCountdownForm({
            title: settings.countdown?.title || '',
            date: settings.countdown?.date ? settings.countdown.date.split('T')[0] : '',
        });
        setShowCountdownModal(true);
    };

    const handleCountdownSave = async () => {
        setSaving(true);
        try {
            const newCountdown = {
                title: countdownForm.title,
                date: new Date(countdownForm.date).toISOString(),
            };

            await updateAppSetting('countdown', newCountdown);
            setSettings((prev) => ({ ...prev, countdown: newCountdown }));
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
            datetime: nextDate.datetime || '',
        });
        setShowNextDateModal(true);
    };

    const handleNextDateSave = async () => {
        setSaving(true);
        try {
            const newNextDate = {
                title: nextDateForm.title,
                description: nextDateForm.description,
                datetime: nextDateForm.datetime,
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

    const formattedNextDate = useMemo(() => {
        if (!nextDate.datetime) return 'Aun sin fecha definida';
        try {
            return format(new Date(nextDate.datetime), "EEEE d 'de' MMMM, HH:mm", { locale: es });
        } catch {
            return nextDate.datetime;
        }
    }, [nextDate.datetime]);

    return (
        <div className="p-5 pb-24 space-y-5">
            <section className="soft-panel rounded-3xl p-5 relative overflow-hidden floating-card">
                <div className="absolute top-0 right-0 w-36 h-36 bg-rose-200/40 rounded-full blur-3xl" />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-rose-500 font-semibold">Mi Prometida</p>
                            <h1 className="text-3xl font-black text-stone-900 dark:text-stone-100 mt-1 leading-tight">
                                Hola, {user?.email?.split('@')[0] || 'amor'}
                            </h1>
                            <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
                                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <ErrorBoundary fallback={<div className="w-9 h-9 rounded-full bg-stone-100" />}>
                                <StreaksWidget count={settings.streaks?.count || 0} />
                            </ErrorBoundary>
                            <button
                                onClick={logout}
                                className="p-2.5 rounded-full bg-white/70 dark:bg-stone-800 text-stone-500 hover:text-red-500 transition-colors"
                                title="Cerrar sesion"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2.5">
                        <div className="rounded-2xl bg-white/70 dark:bg-stone-800/70 p-3">
                            <p className="text-[10px] uppercase tracking-wider text-stone-500">Juntos</p>
                            <p className="text-xl font-black text-stone-800 dark:text-stone-100">{daysTogether}</p>
                            <p className="text-[11px] text-stone-500">dias</p>
                        </div>
                        <div className="rounded-2xl bg-white/70 dark:bg-stone-800/70 p-3">
                            <p className="text-[10px] uppercase tracking-wider text-stone-500">Mood hoy</p>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100 mt-1">{moodLabel}</p>
                        </div>
                        <button
                            onClick={handleNextDateEdit}
                            className="rounded-2xl bg-white/70 dark:bg-stone-800/70 p-3 text-left hover:bg-white/85 dark:hover:bg-stone-800 transition-colors"
                        >
                            <p className="text-[10px] uppercase tracking-wider text-stone-500">Proxima cita</p>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100 mt-1 line-clamp-2">{nextDate.title}</p>
                        </button>
                    </div>
                </div>
            </section>

            {!todayMood && (
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/daily')}
                    className="w-full soft-panel rounded-2xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
                            <HeartHandshake size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-stone-800 dark:text-stone-100">Falta tu check-in de hoy</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Toma 10 segundos y mantiene su conexion diaria.</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-stone-400" />
                </motion.button>
            )}

            <section className="grid grid-cols-2 gap-3">
                <ActionCard
                    title="Chat"
                    subtitle="Hablen en tiempo real"
                    icon={MessageCircle}
                    onClick={() => navigate('/chat')}
                    gradient="bg-gradient-to-br from-rose-500 to-pink-600"
                />
                <ActionCard
                    title="Diario"
                    subtitle="Mood y nota de hoy"
                    icon={Smile}
                    onClick={() => navigate('/daily')}
                    gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                />
                <ActionCard
                    title="Wishlist"
                    subtitle="Planes y cupones"
                    icon={ListTodo}
                    onClick={() => navigate('/wishlist')}
                    gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
                />
                <ActionCard
                    title="Galeria"
                    subtitle="Recuerdos y videos"
                    icon={ImageIcon}
                    onClick={() => navigate('/gallery')}
                    gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                />
            </section>

            <section className="space-y-4">
                <ErrorBoundary>
                    <CountdownWidget
                        targetDate={settings.countdown?.date}
                        title={settings.countdown?.title}
                        onEdit={handleCountdownEdit}
                    />
                </ErrorBoundary>

                <button
                    onClick={handleNextDateEdit}
                    className="w-full glass-card rounded-2xl p-4 text-left hover:bg-white/70 dark:hover:bg-stone-800/70 transition-colors"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-stone-500 mb-1">Proxima cita</p>
                            <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">{nextDate.title || 'Sin planificar'}</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400 capitalize mt-1">{formattedNextDate}</p>
                            {nextDate.description && (
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{nextDate.description}</p>
                            )}
                        </div>
                        <div className="p-2 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500">
                            <Clock3 size={16} />
                        </div>
                    </div>
                </button>
            </section>

            <section className="pt-1">
                <ErrorBoundary>
                    <StickyNotes showPushNotification={true} title="Tablon de notas" />
                </ErrorBoundary>
            </section>

            <AnimatePresence>
                {showCountdownModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowCountdownModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                            className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Editar cuenta regresiva</h3>
                                <button onClick={() => setShowCountdownModal(false)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700">
                                    <X size={18} className="text-stone-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Titulo</label>
                                    <input
                                        type="text"
                                        value={countdownForm.title}
                                        onChange={(e) => setCountdownForm((prev) => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700"
                                        placeholder="Ej: Nuestro gran dia"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={countdownForm.date}
                                        onChange={(e) => setCountdownForm((prev) => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCountdownModal(false)}
                                    className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-400"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCountdownSave}
                                    disabled={saving || !countdownForm.title || !countdownForm.date}
                                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showNextDateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowNextDateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                            className="bg-white dark:bg-stone-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100">Editar proxima cita</h3>
                                <button onClick={() => setShowNextDateModal(false)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700">
                                    <X size={18} className="text-stone-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Titulo</label>
                                    <input
                                        type="text"
                                        value={nextDateForm.title}
                                        onChange={(e) => setNextDateForm((prev) => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700"
                                        placeholder="Ej: Cena romantica"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Descripcion (opcional)</label>
                                    <input
                                        type="text"
                                        value={nextDateForm.description}
                                        onChange={(e) => setNextDateForm((prev) => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700"
                                        placeholder="Ej: en la playa"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">Fecha y hora</label>
                                    <input
                                        type="datetime-local"
                                        value={nextDateForm.datetime}
                                        onChange={(e) => setNextDateForm((prev) => ({ ...prev, datetime: e.target.value }))}
                                        className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowNextDateModal(false)}
                                    className="flex-1 px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-600 dark:text-stone-400"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNextDateSave}
                                    disabled={saving || !nextDateForm.title}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
