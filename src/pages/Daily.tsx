import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Smile, Frown, Meh, Zap, Moon, Bell, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { requestPushPermission } from '../utils/notifications';
import { PageHeader } from '../components/ui/PageHeader';

const MOODS = [
    { id: 'happy', label: 'Feliz', icon: Smile, accent: 'from-yellow-400 to-orange-400' },
    { id: 'excited', label: 'Con energia', icon: Zap, accent: 'from-amber-500 to-orange-500' },
    { id: 'neutral', label: 'Tranquilo', icon: Meh, accent: 'from-stone-400 to-stone-500' },
    { id: 'tired', label: 'Cansado', icon: Moon, accent: 'from-sky-500 to-blue-500' },
    { id: 'sad', label: 'Necesita abrazo', icon: Frown, accent: 'from-indigo-500 to-violet-500' },
] as const;

const MoodButton = React.memo(
    ({
        mood,
        isSelected,
        onSelect,
    }: {
        mood: typeof MOODS[number];
        isSelected: boolean;
        onSelect: (id: typeof MOODS[number]['id']) => void;
    }) => (
        <button onClick={() => onSelect(mood.id)} className="group relative min-w-0">
            <motion.div
                whileTap={{ scale: 0.96 }}
                animate={{
                    y: isSelected ? -4 : 0,
                    scale: isSelected ? 1.02 : 1,
                }}
                className={cn(
                    'flex h-full min-h-[7.2rem] flex-col rounded-[1.4rem] border p-3 text-center transition-all duration-300',
                    isSelected
                        ? 'border-white/75 bg-white text-stone-900 shadow-[0_18px_34px_rgba(103,61,76,0.16)] dark:border-white/10 dark:bg-white/8 dark:text-stone-100'
                        : 'border-white/65 bg-white/55 text-stone-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-stone-400'
                )}
            >
                <div
                    className={cn(
                        'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                        mood.accent
                    )}
                >
                    <mood.icon size={22} />
                </div>
                <span className="mt-3 block text-[0.62rem] font-semibold uppercase tracking-[0.1em] leading-4 break-words text-balance">
                    {mood.label}
                </span>
            </motion.div>
        </button>
    )
);

export const Daily: React.FC = () => {
    const { addMood, moods } = useApp();
    const [feedback, setFeedback] = useState('');
    const [moodNoteDraft, setMoodNoteDraft] = useState<string | null>(null);

    const todayMood = useMemo(
        () => moods.find((m: { date: string }) => new Date(m.date).toDateString() === new Date().toDateString()),
        [moods]
    );

    const moodNote = moodNoteDraft ?? todayMood?.note ?? '';

    const handleMoodSelect = (moodId: typeof MOODS[number]['id']) => {
        void addMood(moodId, moodNote);

        const moodLabel = MOODS.find((mood) => mood.id === moodId)?.label;
        setFeedback(
            moodId === 'happy' || moodId === 'excited'
                ? `Que bonito saber que hoy estas ${moodLabel?.toLowerCase()}.`
                : moodId === 'neutral'
                    ? 'Los dias tranquilos tambien cuentan.'
                    : 'Recibido. Hoy toca mas cuidado y compania.'
        );

        setTimeout(() => setFeedback(''), 3000);
    };

    const handleSaveNote = async () => {
        if (!todayMood) {
            toast.info('Primero elige como te sientes hoy.');
            return;
        }

        await addMood(todayMood.mood, moodNote);
        setMoodNoteDraft(moodNote);
        toast.success('Nota guardada.');
    };

    return (
        <div className="page-shell">
            <PageHeader kicker="Diario" title="Conexion diaria" />

            <section className="section-card rounded-[1.95rem] p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Mood del dia</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            Como te sientes hoy
                        </h2>
                    </div>

                    <button
                        onClick={async () => {
                            const granted = await requestPushPermission();
                            if (!granted) {
                                toast.error('No se pudieron activar las notificaciones.');
                                return;
                            }

                            toast.success('Notificaciones activadas.');
                        }}
                        className="inline-flex min-h-[2.8rem] shrink-0 items-center justify-center gap-2 rounded-full border border-white/70 bg-white/65 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-stone-200"
                    >
                        <Bell size={14} />
                        Alertas
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-3">
                    {MOODS.map((mood) => (
                        <MoodButton
                            key={mood.id}
                            mood={mood}
                            isSelected={todayMood?.mood === mood.id}
                            onSelect={handleMoodSelect}
                        />
                    ))}
                </div>

                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mt-5 rounded-[1.2rem] bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                        >
                            {feedback}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            <section className="section-card rounded-[1.95rem] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="section-label">Nota</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            Nota
                        </h2>
                    </div>

                    {todayMood && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <CheckCircle2 size={14} />
                            Guardado hoy
                        </div>
                    )}
                </div>

                <textarea
                    value={moodNote}
                    onChange={(event) => setMoodNoteDraft(event.target.value)}
                    placeholder="Escribe como te fue, que te gusto o si necesitas algo del otro."
                    className="textarea-shell min-h-[8rem]"
                    rows={4}
                    maxLength={220}
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-stone-400">{moodNote.length}/220</span>
                    <button onClick={handleSaveNote} className="primary-button px-5 text-sm">
                        Guardar nota
                    </button>
                </div>
            </section>

            {moods.length > 0 && (
                <section className="section-card rounded-[1.95rem] p-5">
                    <p className="section-label">Ultimos dias</p>
                    <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                        Historial rapido
                    </h2>

                    <div className="mt-5 grid grid-cols-5 gap-2">
                        {moods.slice(0, 5).map((mood) => {
                            const moodConfig = MOODS.find((item) => item.id === mood.mood);
                            if (!moodConfig) return null;

                            return (
                                <div
                                    key={mood.id}
                                    className="rounded-[1.35rem] border border-white/65 bg-white/58 p-3 text-center shadow-sm dark:border-white/10 dark:bg-white/5"
                                    title={mood.note || ''}
                                >
                                    <div
                                        className={cn(
                                            'mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white',
                                            moodConfig.accent
                                        )}
                                    >
                                        <moodConfig.icon size={18} />
                                    </div>
                                    <span className="mt-3 block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                                        {new Date(mood.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};
