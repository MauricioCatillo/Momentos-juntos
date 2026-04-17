import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CalendarDays,
    HeartHandshake,
    LogOut,
    MessageCircle,
    MoonStar,
    NotebookTabs,
    Sparkles,
    SunMedium,
    PanelsTopLeft,
    X,
    Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import { StickyNotes } from '../components/StickyNotes';
import { getAppSettings, getLatestMessage, updateAppSetting } from '../supabaseClient';

interface NextDateData {
    title: string;
    description: string;
    datetime: string;
}

interface HomeSettings {
    countdown: { date: string; title: string };
}

interface LatestMessageData {
    id: string;
    content: string;
    created_at: string;
}

const InfoPill = ({
    label,
    value,
    icon: Icon,
    onClick,
    accent,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick?: () => void;
    accent?: string;
}) => {
    const Wrapper = onClick ? motion.button : motion.div;
    return (
        <Wrapper
            whileTap={onClick ? { scale: 0.97 } : undefined}
            onClick={onClick}
            className={`flex min-w-[8.5rem] shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur-md transition-colors dark:border-white/[0.06] dark:bg-white/[0.03] ${onClick ? 'cursor-pointer hover:bg-white/8 dark:hover:bg-white/[0.06]' : ''}`}
        >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent || 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]'}`}>
                <Icon size={16} />
            </div>
            <div className="min-w-0">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-tertiary)]">
                    {label}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[color:var(--text-primary)]">
                    {value}
                </p>
            </div>
        </Wrapper>
    );
};

const QuickLink = ({
    title,
    icon: Icon,
    onClick,
    gradient,
}: {
    title: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick: () => void;
    gradient: string;
}) => (
    <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="group flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-left backdrop-blur-md transition-all hover:bg-white/8 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
    >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            <Icon size={16} />
        </div>
        <span className="text-sm font-semibold text-[color:var(--text-primary)]">{title}</span>
    </motion.button>
);

export const Home: React.FC = () => {
    const { moods, user, logout, theme, toggleTheme } = useApp();
    const navigate = useNavigate();

    const [settings, setSettings] = useState<HomeSettings>({
        countdown: { date: '', title: '' },
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

    const todayMood = useMemo(
        () => moods.find((entry) => new Date(entry.date).toDateString() === new Date().toDateString()),
        [moods]
    );

    const relationshipDays = useMemo(() => differenceInDays(new Date(), new Date('2022-12-21')), []);

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                const [appSettings, message] = await Promise.all([getAppSettings(), getLatestMessage()]);

                if (appSettings.countdown) {
                    setSettings((prev) => ({ ...prev, countdown: appSettings.countdown as HomeSettings['countdown'] }));
                }

                if (appSettings.next_date) {
                    setNextDate(appSettings.next_date as NextDateData);
                }

                setLatestMessage(message);
            } catch (error) {
                console.error('Error loading home data:', error);
            }
        };

        void loadHomeData();
    }, []);

    const moodLabel = useMemo(() => {
        const moodMap: Record<string, string> = {
            happy: 'Feliz',
            excited: 'Con energia',
            neutral: 'Tranquilo',
            tired: 'Cansado',
            sad: 'Abrazo',
        };

        return todayMood ? moodMap[todayMood.mood] || 'Sin registro' : 'Pendiente';
    }, [todayMood]);

    const formattedNextDate = useMemo(() => {
        if (!nextDate.datetime) return 'Sin fecha definida';

        try {
            return format(new Date(nextDate.datetime), "EEEE d 'de' MMMM, HH:mm", { locale: es });
        } catch {
            return nextDate.datetime;
        }
    }, [nextDate.datetime]);

    const countdownCopy = useMemo(() => {
        if (!settings.countdown?.date) {
            return { title: 'Sin fecha', body: 'Guarda una.' };
        }

        const parsedDate = new Date(settings.countdown.date);
        if (Number.isNaN(parsedDate.getTime())) {
            return { title: 'Invalida', body: 'Ajustala.' };
        }

        const days = differenceInCalendarDays(parsedDate, new Date());
        return {
            title: `${days >= 0 ? days : 0} dias`,
            body: settings.countdown.title || 'Cuenta atras',
        };
    }, [settings.countdown]);

    const messageCopy = latestMessage
        ? {
            title: latestMessage.content.length > 30 ? latestMessage.content.slice(0, 30) + '…' : latestMessage.content,
            body: format(new Date(latestMessage.created_at), "HH:mm", { locale: es }),
        }
        : {
            title: 'Sin mensajes',
            body: '',
        };

    const handleCountdownEdit = () => {
        setCountdownForm({
            title: settings.countdown?.title || '',
            date: settings.countdown?.date ? settings.countdown.date.split('T')[0] : '',
        });
        setShowCountdownModal(true);
    };

    const handleNextDateEdit = () => {
        setNextDateForm({
            title: nextDate.title || '',
            description: nextDate.description || '',
            datetime: nextDate.datetime || '',
        });
        setShowNextDateModal(true);
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

    return (
        <div className="page-shell">
            {/* ─── Compact Greeting ──────────────────────── */}
            <section className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="page-kicker">Su rincon privado</p>
                    <h1 className="display-font mt-1 text-[2.4rem] leading-none text-[color:var(--text-primary)]">
                        Hola, <span className="gradient-text">{user?.email?.split('@')[0] || 'amor'}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={toggleTheme}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[color:var(--text-secondary)] backdrop-blur-md transition-colors hover:text-[color:var(--accent)] dark:border-white/[0.06] dark:bg-white/[0.03]"
                        title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
                    >
                        {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
                    </button>
                    <button
                        onClick={logout}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[color:var(--text-secondary)] backdrop-blur-md transition-colors hover:text-red-400 dark:border-white/[0.06] dark:bg-white/[0.03]"
                        title="Cerrar sesion"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </section>

            {/* ─── Day counter + Date pill ──────────────── */}
            <section className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[color:var(--accent)] to-[#c44490] px-4 py-2 text-white shadow-lg">
                    <Heart size={12} className="fill-current" />
                    <span className="text-xs font-bold">{relationshipDays} dias juntos</span>
                </div>
                <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)] backdrop-blur-md dark:border-white/[0.06]">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                </div>
            </section>

            {/* ─── Notes (FIRST – always visible) ────────── */}
            <StickyNotes showPushNotification={true} title="Notas a mano" />

            {/* ─── Info Strip (scrollable) ────────────────── */}
            <section className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide chip-scroll">
                <InfoPill
                    label="Estado"
                    value={moodLabel}
                    icon={HeartHandshake}
                    onClick={() => navigate('/daily')}
                    accent="bg-amber-500/15 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
                />
                <InfoPill
                    label="Cuenta atras"
                    value={countdownCopy.title}
                    icon={NotebookTabs}
                    onClick={handleCountdownEdit}
                    accent="bg-violet-500/15 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400"
                />
                <InfoPill
                    label="Proxima cita"
                    value={nextDate.title || 'Sin plan'}
                    icon={CalendarDays}
                    onClick={handleNextDateEdit}
                    accent="bg-sky-500/15 text-sky-500 dark:bg-sky-500/10 dark:text-sky-400"
                />
                <InfoPill
                    label="Ultimo mensaje"
                    value={messageCopy.title}
                    icon={MessageCircle}
                    onClick={() => navigate('/chat')}
                    accent="bg-rose-500/15 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400"
                />
            </section>

            {/* ─── Quick Links ─────────────────────────────── */}
            <section className="flex gap-2.5">
                <QuickLink title="Chat" icon={MessageCircle} onClick={() => navigate('/chat')} gradient="from-rose-500 to-pink-600" />
                <QuickLink title="Recuerdos" icon={Sparkles} onClick={() => navigate('/memories')} gradient="from-violet-500 to-indigo-600" />
                <QuickLink title="Mas" icon={PanelsTopLeft} onClick={() => navigate('/more')} gradient="from-amber-500 to-orange-600" />
            </section>

            {/* ─── Countdown Modal ──────────────────────── */}
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
                                    <p className="section-label">Cuenta atras</p>
                                    <h3 className="display-font mt-2 text-[2rem] leading-none text-[color:var(--text-primary)]">
                                        Guardar fecha
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowCountdownModal(false)}
                                    className="rounded-full p-2 text-[color:var(--text-tertiary)] transition-colors hover:bg-white/10 hover:text-[color:var(--text-primary)]"
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
                                        placeholder="Ej. Proxima visita"
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
                                <button onClick={() => setShowCountdownModal(false)} className="secondary-button px-4">
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

            {/* ─── Next Date Modal ──────────────────────── */}
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
                                    <h3 className="display-font mt-2 text-[2rem] leading-none text-[color:var(--text-primary)]">
                                        Ajustar plan
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowNextDateModal(false)}
                                    className="rounded-full p-2 text-[color:var(--text-tertiary)] transition-colors hover:bg-white/10 hover:text-[color:var(--text-primary)]"
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
                                        placeholder="Ej. Cena especial"
                                    />
                                </label>

                                <label className="block">
                                    <span className="section-label mb-2 block">Descripcion</span>
                                    <input
                                        type="text"
                                        value={nextDateForm.description}
                                        onChange={(event) => setNextDateForm((prev) => ({ ...prev, description: event.target.value }))}
                                        className="input-shell"
                                        placeholder="Algo corto para recordarlo"
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
                                <button onClick={() => setShowNextDateModal(false)} className="secondary-button px-4">
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
