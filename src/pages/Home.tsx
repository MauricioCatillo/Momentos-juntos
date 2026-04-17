import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CalendarDays,
    ChevronRight,
    Heart,
    HeartHandshake,
    LogOut,
    MessageCircle,
    MoonStar,
    NotebookTabs,
    PanelsTopLeft,
    Sparkles,
    SunMedium,
    X,
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

const StatusCard = ({
    label,
    value,
    caption,
    icon: Icon,
    accent,
    onClick,
}: {
    label: string;
    value: string;
    caption: string;
    icon: React.ComponentType<{ size?: number }>;
    accent: string;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="action-tile text-left"
    >
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
                    {label}
                </p>
                <p className="mt-3 text-lg font-semibold text-[color:var(--text-primary)]">{value}</p>
                <p className="mt-1 text-sm leading-5 text-[color:var(--text-secondary)]">{caption}</p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
                <Icon size={18} />
            </div>
        </div>
    </motion.button>
);

const ShortcutTile = ({
    title,
    helper,
    icon: Icon,
    gradient,
    onClick,
}: {
    title: string;
    helper: string;
    icon: React.ComponentType<{ size?: number }>;
    gradient: string;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${gradient} p-4 text-left text-white shadow-[0_20px_42px_rgba(55,31,24,0.18)]`}
    >
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/12 blur-2xl" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-white/68">Acceso</p>
                    <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/14 backdrop-blur-md">
                    <Icon size={18} />
                </div>
            </div>

            <div className="flex items-center justify-between gap-3">
                <p className="text-sm leading-5 text-white/78">{helper}</p>
                <ChevronRight size={18} className="shrink-0 text-white/86" />
            </div>
        </div>
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
            title: latestMessage.content.length > 34 ? `${latestMessage.content.slice(0, 34)}...` : latestMessage.content,
            body: format(new Date(latestMessage.created_at), 'HH:mm', { locale: es }),
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
            <section className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="page-kicker">Inicio</p>
                    <h1 className="display-font mt-1 text-[2.55rem] leading-none text-[color:var(--text-primary)]">
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

            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="hero-panel"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="hero-kicker">Nuestro refugio movil</p>
                        <h2 className="display-font mt-3 text-[2.65rem] leading-[0.92] text-white">
                            Todo lo bonito, cerca y en orden.
                        </h2>
                    </div>

                    <div className="hero-chip shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/88">
                        <Heart size={12} className="fill-current" />
                        {relationshipDays} dias
                    </div>
                </div>

                <p className="mt-4 max-w-[17rem] text-sm leading-6 text-white/76">
                    Las notas, el chat y sus recuerdos quedan a un toque para que lo que mas usan siempre este primero.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                    <div className="hero-chip text-sm font-medium text-white/84">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="hero-chip text-sm font-medium text-white/84">
                        {nextDate.title || 'Sin proxima cita'}
                    </div>
                </div>

                <div className="mt-5 metric-strip">
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Estado</p>
                        <p className="mt-2 text-base font-semibold text-white">{moodLabel}</p>
                    </div>
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Cuenta atras</p>
                        <p className="mt-2 text-base font-semibold text-white">{countdownCopy.title}</p>
                    </div>
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Mensaje</p>
                        <p className="mt-2 text-base font-semibold text-white">{latestMessage ? 'Nuevo' : 'Vacio'}</p>
                    </div>
                </div>
            </motion.section>

            <StickyNotes
                showPushNotification={true}
                title="Notas entre ustedes"
                subtitle="Como es lo que mas usan, ahora queda arriba y con acceso directo desde inicio."
                variant="spotlight"
            />

            <section className="grid grid-cols-1 gap-3">
                <StatusCard
                    label="Cuenta atras"
                    value={countdownCopy.title}
                    caption={countdownCopy.body}
                    icon={NotebookTabs}
                    accent="bg-white/70 text-[color:var(--accent)] dark:bg-white/10 dark:text-[color:var(--accent-strong)]"
                    onClick={handleCountdownEdit}
                />
                <StatusCard
                    label="Proxima cita"
                    value={nextDate.title || 'Sin plan'}
                    caption={formattedNextDate}
                    icon={CalendarDays}
                    accent="bg-amber-500/14 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300"
                    onClick={handleNextDateEdit}
                />
                <StatusCard
                    label="Ultimo mensaje"
                    value={messageCopy.title}
                    caption={messageCopy.body || 'Sin movimiento reciente'}
                    icon={MessageCircle}
                    accent="bg-sky-500/14 text-sky-500 dark:bg-sky-500/10 dark:text-sky-300"
                    onClick={() => navigate('/chat')}
                />
            </section>

            <section className="grid grid-cols-2 gap-3">
                <ShortcutTile
                    title="Chat"
                    helper="Abrir conversacion y responder rapido."
                    icon={MessageCircle}
                    gradient="from-[#3b2024] via-[#934855] to-[#d97e72]"
                    onClick={() => navigate('/chat')}
                />
                <ShortcutTile
                    title="Check-in"
                    helper="Registrar como estuvo el dia."
                    icon={HeartHandshake}
                    gradient="from-[#27443d] via-[#52786c] to-[#89b19b]"
                    onClick={() => navigate('/daily')}
                />
                <ShortcutTile
                    title="Recuerdos"
                    helper="Entrar a fotos, historia y galeria."
                    icon={Sparkles}
                    gradient="from-[#4b3144] via-[#76516d] to-[#b48ba2]"
                    onClick={() => navigate('/memories')}
                />
                <ShortcutTile
                    title="Mas"
                    helper="Herramientas, notas y pendientes."
                    icon={PanelsTopLeft}
                    gradient="from-[#6b4428] via-[#b47143] to-[#d8a173]"
                    onClick={() => navigate('/more')}
                />
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
