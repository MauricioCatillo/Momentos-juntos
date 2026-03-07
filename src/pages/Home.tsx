import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CalendarDays,
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

const QuickLink = ({
    title,
    description,
    icon: Icon,
    onClick,
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="rounded-[1.45rem] border border-white/70 bg-white/70 p-4 text-left shadow-sm transition-colors hover:bg-white/85 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
    >
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="section-label">{title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{description}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900">
                <Icon size={16} />
            </div>
        </div>
    </motion.button>
);

const SummaryCard = ({
    kicker,
    title,
    body,
    icon: Icon,
    onClick,
}: {
    kicker: string;
    title: string;
    body: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick?: () => void;
}) => {
    const content = (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="section-label">{kicker}</p>
                <p className="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-100">{title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{body}</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(179,95,61,0.12)] text-[color:var(--accent)] dark:bg-[rgba(240,171,132,0.12)] dark:text-[color:var(--accent)]">
                <Icon size={18} />
            </div>
        </div>
    );

    if (!onClick) {
        return <div className="section-card rounded-[1.6rem] p-4">{content}</div>;
    }

    return (
        <button
            onClick={onClick}
            className="section-card rounded-[1.6rem] p-4 text-left transition-transform hover:-translate-y-0.5"
        >
            {content}
        </button>
    );
};

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
            sad: 'Necesita abrazo',
        };

        return todayMood ? moodMap[todayMood.mood] || 'Sin registro' : 'Sin registro';
    }, [todayMood]);

    const formattedNextDate = useMemo(() => {
        if (!nextDate.datetime) return 'Todavia no definieron una fecha.';

        try {
            return format(new Date(nextDate.datetime), "EEEE d 'de' MMMM, HH:mm", { locale: es });
        } catch {
            return nextDate.datetime;
        }
    }, [nextDate.datetime]);

    const countdownCopy = useMemo(() => {
        if (!settings.countdown?.date) {
            return {
                title: 'Sin cuenta atras',
                body: 'Guarden una fecha importante para verla aqui.',
            };
        }

        const parsedDate = new Date(settings.countdown.date);
        if (Number.isNaN(parsedDate.getTime())) {
            return {
                title: 'Fecha invalida',
                body: 'Vuelvan a ajustar la fecha.',
            };
        }

        const days = differenceInCalendarDays(parsedDate, new Date());
        return {
            title: `${days >= 0 ? days : 0} dias`,
            body: `${settings.countdown.title || 'Cuenta atras'} · ${format(parsedDate, "d 'de' MMM", { locale: es })}`,
        };
    }, [settings.countdown]);

    const messageCopy = latestMessage
        ? {
            title: latestMessage.content,
            body: format(new Date(latestMessage.created_at), "HH:mm 'de' EEEE", { locale: es }),
        }
        : {
            title: 'Todavia no hay mensajes',
            body: 'Empiecen la conversacion desde el chat.',
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
            <section className="overflow-hidden rounded-[2rem] border border-[rgba(100,71,49,0.08)] bg-[linear-gradient(140deg,rgba(255,252,247,0.98)_0%,rgba(245,236,226,0.94)_52%,rgba(233,242,236,0.92)_100%)] p-5 shadow-[0_24px_54px_rgba(86,60,40,0.12)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(29,23,19,0.98)_0%,rgba(35,28,23,0.96)_52%,rgba(18,35,32,0.92)_100%)]">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="page-kicker">Inicio privado</p>
                        <h1 className="display-font mt-2 text-[3rem] leading-none text-stone-900 dark:text-stone-100">
                            Su rincon
                        </h1>
                        <p className="mt-3 max-w-[16rem] text-sm leading-6 text-stone-600 dark:text-stone-300">
                            Donde miran lo importante, anotan cosas rapidas y vuelven a hablar.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-stone-700 shadow-sm transition-colors hover:text-[color:var(--accent)] dark:border-white/10 dark:bg-white/8 dark:text-stone-200"
                            title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
                        >
                            {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
                        </button>
                        <button
                            onClick={logout}
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-stone-700 shadow-sm transition-colors hover:text-red-500 dark:border-white/10 dark:bg-white/8 dark:text-stone-200"
                            title="Cerrar sesion"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-[1.45rem] bg-white/78 p-4 shadow-sm dark:bg-white/6">
                        <p className="section-label">Juntos</p>
                        <p className="mt-3 text-3xl font-black text-stone-900 dark:text-stone-100">{relationshipDays}</p>
                    </div>
                    <div className="rounded-[1.45rem] bg-white/78 p-4 shadow-sm dark:bg-white/6">
                        <p className="section-label">Hoy</p>
                        <p className="mt-3 text-xl font-semibold text-stone-900 dark:text-stone-100">{moodLabel}</p>
                    </div>
                </div>

                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <div className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white dark:bg-white dark:text-stone-900">
                        {user?.email?.split('@')[0] || 'amor'}
                    </div>
                    <div className="shrink-0 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 dark:border-white/10 dark:bg-white/8 dark:text-stone-300">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                    </div>
                </div>
            </section>

            <StickyNotes showPushNotification={true} title="Notas a mano" />

            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <QuickLink
                    title="Chat"
                    description="Entren rapido al chat privado."
                    icon={MessageCircle}
                    onClick={() => navigate('/chat')}
                />
                <QuickLink
                    title="Recuerdos"
                    description="Historia, fotos y videos sin vueltas."
                    icon={Sparkles}
                    onClick={() => navigate('/memories')}
                />
                <QuickLink
                    title="Mas"
                    description="Check-in, wishlist y herramientas."
                    icon={PanelsTopLeft}
                    onClick={() => navigate('/more')}
                />
            </section>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <SummaryCard
                    kicker="Proxima cita"
                    title={nextDate.title || 'Sin plan todavia'}
                    body={nextDate.description ? `${formattedNextDate} · ${nextDate.description}` : formattedNextDate}
                    icon={CalendarDays}
                    onClick={handleNextDateEdit}
                />
                <SummaryCard
                    kicker="Ultimo mensaje"
                    title={messageCopy.title}
                    body={messageCopy.body}
                    icon={MessageCircle}
                    onClick={() => navigate('/chat')}
                />
                <SummaryCard
                    kicker="Check-in"
                    title={todayMood ? 'Ya registraron el dia' : 'Falta registrar hoy'}
                    body={todayMood ? 'Pueden actualizarlo desde la seccion Mas.' : 'Respondan rapido como se sienten hoy.'}
                    icon={HeartHandshake}
                    onClick={() => navigate('/daily')}
                />
                <SummaryCard
                    kicker="Cuenta atras"
                    title={countdownCopy.title}
                    body={countdownCopy.body}
                    icon={NotebookTabs}
                    onClick={handleCountdownEdit}
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
                                    <h3 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                                        Guardar fecha
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
