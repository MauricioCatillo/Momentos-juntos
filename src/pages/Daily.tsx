import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Smile, Frown, Meh, Zap, Moon, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { requestPushPermission } from '../utils/notifications';

const MOODS = [
    { id: 'happy', label: 'Feliz', icon: Smile, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300' },
    { id: 'excited', label: 'Emocionado', icon: Zap, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' },
    { id: 'neutral', label: 'Normal', icon: Meh, color: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' },
    { id: 'tired', label: 'Cansado', icon: Moon, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' },
    { id: 'sad', label: 'Triste', icon: Frown, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' },
] as const;

const MoodButton = React.memo(({ mood, isSelected, onSelect }: { mood: typeof MOODS[number], isSelected: boolean, onSelect: (id: typeof MOODS[number]['id']) => void }) => {
    return (
        <button
            onClick={() => onSelect(mood.id)}
            className="group relative flex flex-col items-center gap-2"
        >
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                    scale: isSelected ? 1.16 : 1,
                    y: isSelected ? -4 : 0
                }}
                className={cn(
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm',
                    isSelected
                        ? 'bg-white dark:bg-stone-800 text-rose-500 border-2 border-rose-400 shadow-lg shadow-rose-200 dark:shadow-none'
                        : 'bg-white dark:bg-stone-800 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'
                )}
            >
                <mood.icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
            </motion.div>
            <span className={cn(
                'text-[10px] font-medium transition-colors duration-300',
                isSelected ? 'text-stone-800 dark:text-stone-100 font-bold' : 'text-stone-400'
            )}>
                {mood.label}
            </span>
        </button>
    );
});

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

        const moodLabel = MOODS.find(m => m.id === moodId)?.label;
        setFeedback(
            moodId === 'happy' || moodId === 'excited'
                ? `Que alegria que estes ${moodLabel}.`
                : moodId === 'neutral'
                    ? 'Un dia tranquilo tambien cuenta.'
                    : 'Te mando un abrazo gigante.'
        );

        setTimeout(() => setFeedback(''), 3000);
    };

    const handleSaveNote = async () => {
        if (!todayMood) {
            toast.info('Primero selecciona como te sientes hoy');
            return;
        }

        await addMood(todayMood.mood, moodNote);
        setMoodNoteDraft(moodNote);
        toast.success('Nota guardada');
    };

    return (
        <div className="p-6 pb-24 space-y-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Conexion diaria</h1>
                <p className="text-stone-600 dark:text-stone-400">Un momento para nosotros</p>
                <button
                    onClick={async () => {
                        const granted = await requestPushPermission();
                        if (!granted) {
                            toast.error('Error al activar notificaciones');
                            return;
                        }

                        toast.success('Notificaciones activadas');
                    }}
                    className="mt-2 text-xs flex items-center gap-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                    <Bell size={12} />
                    Activar notificaciones
                </button>
            </header>

            <div className="glass-card rounded-3xl p-6 mb-8 relative overflow-hidden">
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">Como te sientes hoy?</h3>

                <div className="flex justify-between items-center gap-2 mb-6">
                    {MOODS.map((mood) => (
                        <MoodButton
                            key={mood.id}
                            mood={mood}
                            isSelected={todayMood?.mood === mood.id}
                            onSelect={handleMoodSelect}
                        />
                    ))}
                </div>

                <div className="mb-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 block mb-2">
                        Nota de hoy (opcional)
                    </label>
                    <textarea
                        value={moodNote}
                        onChange={(e) => setMoodNoteDraft(e.target.value)}
                        placeholder="Escribe como te fue hoy, que te gusto o que necesitas."
                        className="w-full rounded-2xl bg-white/80 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-4 py-3 text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300/40"
                        rows={3}
                        maxLength={220}
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-stone-400">{moodNote.length}/220</span>
                        <button
                            onClick={handleSaveNote}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-stone-800 text-white hover:bg-stone-900 transition-colors"
                        >
                            Guardar nota
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center text-sm font-medium text-soft-blush dark:text-pink-300 mb-4"
                        >
                            {feedback}
                        </motion.div>
                    )}
                </AnimatePresence>

                {moods.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-700">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Historial reciente</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {moods.slice(0, 5).map((m) => {
                                const moodConfig = MOODS.find(md => md.id === m.mood);
                                if (!moodConfig) return null;

                                return (
                                    <div key={m.id} className="flex flex-col items-center min-w-[3rem]" title={m.note || ''}>
                                        <div className={cn(
                                            'w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs',
                                            moodConfig.color
                                        )}>
                                            <moodConfig.icon size={14} />
                                        </div>
                                        <span className="text-[9px] text-stone-400">
                                            {new Date(m.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
