import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays,
    ChevronRight,
    Heart,
    HeartHandshake,
    LogOut,
    MessageCircle,
    MoonStar,
    PanelsTopLeft,
    SunMedium,
    X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, differenceInCalendarDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { StreaksWidget } from '../components/StreaksWidget';
import { getAppSettings, getLatestMessage, updateAppSetting } from '../supabaseClient';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface NextDateData {
    title: string;
    description: string;
    datetime: string;
}

interface HomeSettings {
    countdown: { date: string; title: string };
    streaks: { count: number };
    next_date?: NextDateData;
}

interface LatestMessageData {
    id: string;
    content: string;
    created_at: string;
}

const actionCards = [
    {
        title: 'Chat',
        path: '/chat',
        icon: MessageCircle,
        gradient: 'from-rose-500 to-pink-500',
    },
    {
        title: 'Recuerdos',
        path: '/memories',
        icon: Heart,
        gradient: 'from-amber-500 to-orange-500',
    },
    {
        title: 'Mas',
        path: '/more',
        icon: PanelsTopLeft,
        gradient: 'from-violet-500 to-indigo-500',
    },
];

const QuickAction = ({
    title,
    icon: Icon,
    gradient,
    onClick,
}: {
    title: string;
    icon: React.ComponentType<{ size?: number }>;
    gradient: string;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative flex min-h-[9rem] overflow-hidden rounded-[1.55rem] bg-gradient-to-br ${gradient} p-4 text-left text-white shadow-[0_18px_36px_rgba(82,46,59,0.14)]`}
    >
        <div className="absolute right-[-1.25rem] top-[-1rem] h-20 w-20 rounded-full bg-white/15 blur-2xl" />
        <div className="relative z-10 flex min-h-full flex-col justify-between space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/18 backdrop-blur-md">
                <Icon size={20} />
            </div>
            <p className="text-base font-semibold leading-6">{title}</p>
        </div>
    </motion.button>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-[1.45rem] border border-white/70 bg-white/62 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">{label}</p>
        <p className="mt-3 text-2xl font-black text-stone-900 dark:text-stone-100">{value}</p>
    </div>
);

export const Home: React.FC = () => {
    const { moods, user, logout, theme, toggleTheme } = useApp();
    const navigate = useNavigate();

    const [settings, setSettings] = useState<HomeSettings>({
        countdown: { date: '', title: '' },
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
    const [latestMessage, setLatestMessage] = useState<LatestMessageData | null>(null);

    const daysTogether = useMemo(() => {
        const startDate = new Date('2022-12-21');
        return differenceInDays(new Date(), startDate);
    }, []);

    const todayMood = useMemo(
        () => moods.find((mood) => new Date(mood.date).toDateString() === new Date().toDateString()),
        [moods]
    );

    const moodLabel = useMemo(() => {
        const map: Record<string, string> = {
            happy: 'Feliz',
            excited: 'Con energia',
            neutral: 'Tranquilo',
            tired: 'Cansado',
            sad: 'Necesita abrazo',
        };

        if (!todayMood) return 'Sin registro';
        return map[todayMood.mood] || 'Sin registro';
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

    useEffect(() => {
        const loadLatestMessage = async () => {
            try {
                const data = await getLatestMessage();
                setLatestMessage(data);
            } catch (error) {
                console.error('Error loading latest message:', error);
            }
        };

        void loadLatestMessage();
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
        if (!nextDate.datetime) return 'Aun no esta definido';
        try {
            return format(new Date(nextDate.datetime), "EEEE d 'de' MMMM, HH:mm", { locale: es });
        } catch {
            return nextDate.datetime;
        }
    }, [nextDate.datetime]);

    const countdownSummary = useMemo(() => {
        if (!settings.countdown?.date) {
            return { days: '--', subtitle: 'Sin fecha' };
        }

        const parsedDate = new Date(settings.countdown.date);
        if (Number.isNaN(parsedDate.getTime())) {
            return { days: '--', subtitle: 'Fecha invalida' };
        }

        const days = differenceInCalendarDays(parsedDate, new Date());
        return {
            days: days >= 0 ? String(days) : '0',
            subtitle: format(parsedDate, "d 'de' MMM", { locale: es }),
        };
    }, [settings.countdown?.date]);

    return (
        <div className="page-shell">
            <section className="section-card relative overflow-hidden rounded-[2rem] p-5">
                <div className="absolute left-[-2rem] top-[-2rem] h-24 w-24 rounded-full bg-rose-300/35 blur-2xl" />
                <div className="absolute bottom-[-2.5rem] right-[-2rem] h-28 w-28 rounded-full bg-sky-300/25 blur-3xl" />

                <div className="relative z-10 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="page-kicker">Mi Prometida</p>
                            <h1 className="page-title mt-2">
                                Hola, {user?.email?.split('@')[0] || 'amor'}
                            </h1>
                            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/70 text-stone-600 shadow-sm backdrop-blur-xl transition-colors hover:text-rose-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
                                title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
                            >
                                {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
                            </button>

                            <ErrorBoundary fallback={<div className="h-11 w-11 rounded-2xl bg-white/60" />}>
                                <StreaksWidget count={settings.streaks?.count || 0} />
                            </ErrorBoundary>

                            <button
                                onClick={logout}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/70 text-stone-600 shadow-sm backdrop-blur-xl transition-colors hover:text-red-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-300"
                                title="Cerrar sesion"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Juntos" value={String(daysTogether)} />
                        <StatCard label="Hoy" value={moodLabel} />
                    </div>
                </div>
            </section>

            <section className="section-card rounded-[1.9rem] p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Resumen de hoy</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            Solo lo importante
                        </h2>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-200">
                        <HeartHandshake size={18} />
                    </div>
                </div>

                <div className="grid gap-3">
                    <button
                        onClick={handleNextDateEdit}
                        className="flex items-start justify-between gap-3 rounded-[1.45rem] border border-white/70 bg-white/65 p-4 text-left shadow-sm transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                    >
                        <div className="min-w-0">
                            <p className="section-label">Proxima cita</p>
                            <p className="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
                                {nextDate.title || 'Sin plan todavia'}
                            </p>
                            <p className="mt-1 text-sm capitalize text-stone-500 dark:text-stone-400">{formattedNextDate}</p>
                            {nextDate.description && (
                                <p className="mt-2 text-sm leading-5 text-stone-500 dark:text-stone-400">{nextDate.description}</p>
                            )}
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-200">
                            <CalendarDays size={18} />
                        </div>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            whileTap={{ scale: 0.99 }}
                            onClick={() => navigate('/daily')}
                            className="rounded-[1.45rem] border border-white/70 bg-white/65 p-4 text-left shadow-sm transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                        >
                            <p className="section-label">Check-in</p>
                            <p className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-100">
                                {todayMood ? 'Hecho hoy' : 'Pendiente'}
                            </p>
                            <p className="mt-2 text-sm leading-5 text-stone-500 dark:text-stone-400">
                                {todayMood ? 'Pueden actualizarlo desde Mas.' : 'Registren como se sienten en un toque.'}
                            </p>
                        </motion.button>

                        <button
                            onClick={handleCountdownEdit}
                            className="rounded-[1.45rem] border border-white/70 bg-white/65 p-4 text-left shadow-sm transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                        >
                            <p className="section-label">Cuenta atras</p>
                            <p className="mt-3 text-3xl font-black text-stone-900 dark:text-stone-100">{countdownSummary.days}</p>
                            <p className="mt-2 text-sm leading-5 text-stone-500 dark:text-stone-400">
                                {settings.countdown?.title || 'Sin titulo'} · {countdownSummary.subtitle}
                            </p>
                        </button>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate('/chat')}
                        className="flex items-start justify-between gap-3 rounded-[1.45rem] border border-white/70 bg-white/65 p-4 text-left shadow-sm transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                    >
                        <div className="min-w-0">
                            <p className="section-label">Ultimo mensaje</p>
                            <p className="mt-2 text-base font-semibold text-stone-900 dark:text-stone-100">
                                {latestMessage?.content || 'Todavia no hay mensajes'}
                            </p>
                            <p className="mt-2 text-sm leading-5 text-stone-500 dark:text-stone-400">
                                {latestMessage?.created_at
                                    ? format(new Date(latestMessage.created_at), "HH:mm 'de' EEEE", { locale: es })
                                    : 'Abre el chat para empezar la conversacion.'}
                            </p>
                        </div>
                        <ChevronRight size={18} className="mt-1 shrink-0 text-stone-400" />
                    </motion.button>
                </div>
            </section>

            <section className="grid grid-cols-3 gap-3">
                {actionCards.map(({ title, path, icon, gradient }) => (
                    <QuickAction
                        key={path}
                        title={title}
                        icon={icon}
                        gradient={gradient}
                        onClick={() => navigate(path)}
                    />
                ))}
            </section>

            <AnimatePresence>
                {showCountdownModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={(event) => event.target === event.currentTarget && setShowCountdownModal(false)}
                    >
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            className="modal-card"
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="section-label">Cuenta regresiva</p>
                                    <h3 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                                        Editar fecha
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowCountdownModal(false)}
                                    className="rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="section-label mb-2 block">Titulo</span>
                                    <input
                                        type="text"
                                        value={countdownForm.title}
                                        onChange={(event) => setCountdownForm((prev) => ({ ...prev, title: event.target.value }))}
                                        className="input-shell"
                                        placeholder="Ej. Nuestro gran dia"
                                    />
                                </label>

                                <label className="block">
                                    <span className="section-label mb-2 block">Fecha</span>
                                    <input
                                        type="date"
                                        value={countdownForm.date}
                                        onChange={(event) => setCountdownForm((prev) => ({ ...prev, date: event.target.value }))}
                                        className="input-shell"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowCountdownModal(false)}
                                    className="secondary-button px-4"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCountdownSave}
                                    disabled={saving || !countdownForm.title || !countdownForm.date}
                                    className="primary-button px-4 disabled:opacity-60"
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
                        className="modal-backdrop"
                        onClick={(event) => event.target === event.currentTarget && setShowNextDateModal(false)}
                    >
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            className="modal-card"
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="section-label">Proxima cita</p>
                                    <h3 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                                        Ajustar plan
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowNextDateModal(false)}
                                    className="rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <span className="section-label mb-2 block">Titulo</span>
                                    <input
                                        type="text"
                                        value={nextDateForm.title}
                                        onChange={(event) => setNextDateForm((prev) => ({ ...prev, title: event.target.value }))}
                                        className="input-shell"
                                        placeholder="Ej. Cena en nuestro lugar"
                                    />
                                </label>

                                <label className="block">
                                    <span className="section-label mb-2 block">Descripcion</span>
                                    <input
                                        type="text"
                                        value={nextDateForm.description}
                                        onChange={(event) => setNextDateForm((prev) => ({ ...prev, description: event.target.value }))}
                                        className="input-shell"
                                        placeholder="Algo corto y facil de recordar"
                                    />
                                </label>

                                <label className="block">
                                    <span className="section-label mb-2 block">Fecha y hora</span>
                                    <input
                                        type="datetime-local"
                                        value={nextDateForm.datetime}
                                        onChange={(event) => setNextDateForm((prev) => ({ ...prev, datetime: event.target.value }))}
                                        className="input-shell"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowNextDateModal(false)}
                                    className="secondary-button px-4"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNextDateSave}
                                    disabled={saving || !nextDateForm.title}
                                    className="primary-button px-4 disabled:opacity-60"
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
