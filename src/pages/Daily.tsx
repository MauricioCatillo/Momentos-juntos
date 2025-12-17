import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import OneSignal from 'react-onesignal';
import { MessageCircle, Smile, Frown, Meh, Zap, Moon, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { StickyNotes } from '../components/StickyNotes';

const QUESTIONS = [
    "¿Cuál es tu recuerdo favorito de este mes?",
    "¿A dónde te gustaría viajar mañana si pudieras?",
    "¿Qué es lo que más valoras de nuestra relación?",
    "¿Cuál fue la primera impresión que tuviste de mí?",
    "¿Qué canción te recuerda a nosotros?",
    "¿Qué comida te gustaría que cocináramos juntos?",
    "¿Cuál es tu sueño más grande en este momento?",
];

const MOODS = [
    { id: 'happy', label: 'Feliz', icon: Smile, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'excited', label: 'Emocionado', icon: Zap, color: 'bg-orange-100 text-orange-600' },
    { id: 'neutral', label: 'Normal', icon: Meh, color: 'bg-gray-100 text-gray-600' },
    { id: 'tired', label: 'Cansado', icon: Moon, color: 'bg-blue-100 text-blue-600' },
    { id: 'sad', label: 'Triste', icon: Frown, color: 'bg-indigo-100 text-indigo-600' },
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
                    scale: isSelected ? 1.2 : 1,
                    y: isSelected ? -5 : 0
                }}
                className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                    isSelected
                        ? "bg-white dark:bg-stone-800 text-rose-500 border-2 border-rose-400 shadow-lg shadow-rose-200 dark:shadow-none scale-110"
                        : "bg-white dark:bg-stone-800 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700"
                )}
            >
                <mood.icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
            </motion.div>
            <span className={cn(
                "text-[10px] font-medium transition-colors duration-300",
                isSelected ? "text-stone-800 dark:text-stone-100 font-bold" : "text-stone-400"
            )}>
                {mood.label}
            </span>
        </button>
    );
});

export const Daily: React.FC = () => {
    const { addMood, moods } = useApp();
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState('');

    // Simple rotation based on day of year
    const [question] = useState(() => {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        return QUESTIONS[dayOfYear % QUESTIONS.length];
    });

    const handleMoodSelect = (moodId: typeof MOODS[number]['id']) => {
        // Fire and forget - NO await
        addMood(moodId);

        const moodLabel = MOODS.find(m => m.id === moodId)?.label;
        setFeedback(
            moodId === 'happy' || moodId === 'excited' ? `¡Qué alegría que estés ${moodLabel}! 🌟` :
                moodId === 'neutral' ? 'Un día tranquilo está bien 🍃' :
                    `Te mando un abrazo enorme ❤️`
        );
        setTimeout(() => setFeedback(''), 3000);
    };

    const todayMood = moods.find((m: { date: string }) => new Date(m.date).toDateString() === new Date().toDateString());

    return (
        <div className="p-6 pb-24 space-y-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Conexión Diaria ✨</h1>
                <p className="text-stone-600 dark:text-stone-400">Un momento para nosotros</p>
                <button
                    onClick={async () => {
                        try {
                            await OneSignal.Slidedown.promptPush();
                        } catch (e) {
                            console.error(e);
                            toast.error('Error al activar notificaciones');
                        }
                    }}
                    className="mt-2 text-xs flex items-center gap-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                >
                    <Bell size={12} />
                    Activar Notificaciones
                </button>
            </header>

            {/* Question Card */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-card rounded-3xl p-8 mb-8 text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-soft-blush to-sage-green" />
                <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 bg-soft-blush/10 rounded-full flex items-center justify-center">
                        <MessageCircle size={32} className="text-soft-blush" />
                    </div>
                </div>
                <h3 className="text-xl font-medium text-stone-800 dark:text-stone-100 mb-6 leading-relaxed">
                    "{question}"
                </h3>
                {!answered ? (
                    <button
                        onClick={() => setAnswered(true)}
                        className="text-sm font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    >
                        Tocar para responder
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-stone-600 dark:text-stone-400 italic"
                    >
                        ¡Cuéntaselo en persona! ❤️
                    </motion.div>
                )}
            </motion.div>

            {/* Mood Check */}
            <div className="glass-card rounded-3xl p-6 mb-8 relative overflow-hidden">
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-6">¿Cómo te sientes hoy?</h3>

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

                {/* Mood History */}
                {moods.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-700">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Historial Reciente</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {moods.slice(0, 5).map((m) => {
                                const moodConfig = MOODS.find(md => md.id === m.mood);
                                if (!moodConfig) return null;
                                return (
                                    <div key={m.id} className="flex flex-col items-center min-w-[3rem]">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs",
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

            {/* Daily Notes Section - Using unified StickyNotes component */}
            <div className="glass-card p-6 rounded-3xl">
                <StickyNotes title="Notas Diarias 📝" showPushNotification={true} />
            </div>


        </div>
    );
};
