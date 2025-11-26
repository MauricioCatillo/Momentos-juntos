import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { MessageCircle, Smile, Frown, Meh, Zap, Moon, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

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

export const Daily: React.FC = () => {
    const { addMood, moods, user } = useApp();
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState('');

    // Notes state
    const [notes, setNotes] = useState<{ id: string, content: string, color: string, created_at: string }[]>([]);
    const [newNote, setNewNote] = useState('');
    const [color, setColor] = useState('yellow');

    useEffect(() => {
        if (!user) return;

        const fetchNotes = async () => {
            const { data } = await supabase
                .from('notes')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) setNotes(data);
        };

        fetchNotes();
    }, [user]);

    // Simple rotation based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const question = QUESTIONS[dayOfYear % QUESTIONS.length];

    const handleMoodSelect = async (moodId: typeof MOODS[number]['id']) => {
        await addMood(moodId);
        const moodLabel = MOODS.find(m => m.id === moodId)?.label;
        setFeedback(
            moodId === 'happy' || moodId === 'excited' ? `¡Qué alegría que estés ${moodLabel}! 🌟` :
                moodId === 'neutral' ? 'Un día tranquilo está bien 🍃' :
                    `Te mando un abrazo enorme ❤️`
        );
        setTimeout(() => setFeedback(''), 3000);
    };

    const todayMood = moods.find((m: { date: string }) => new Date(m.date).toDateString() === new Date().toDateString());

    const handleAddNote = async () => {
        if (!newNote.trim() || !user) return;

        const { data, error } = await supabase
            .from('notes')
            .insert([{
                content: newNote,
                color,
                author: user.id
            }])
            .select()
            .single();

        if (data && !error) {
            setNotes([data, ...notes]);
            setNewNote('');
        }
    };

    const handleDeleteNote = async (id: string) => {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (!error) {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    return (
        <div className="p-6 pb-24 space-y-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-2">Conexión Diaria ✨</h1>
                <p className="text-stone-600 dark:text-stone-400">Un momento para nosotros</p>
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
                    {MOODS.map((mood) => {
                        const isSelected = todayMood?.mood === mood.id;
                        return (
                            <button
                                key={mood.id}
                                onClick={() => handleMoodSelect(mood.id)}
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
                                            ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 shadow-lg ring-4 ring-stone-100 dark:ring-stone-800"
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
                    })}
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

            {/* Daily Notes Section */}
            <div>
                <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Notas Diarias 📝</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`p-4 rounded-2xl shadow-sm relative group ${note.color === 'yellow' ? 'bg-yellow-100 text-yellow-900' :
                                note.color === 'pink' ? 'bg-pink-100 text-pink-900' :
                                    note.color === 'blue' ? 'bg-blue-100 text-blue-900' :
                                        'bg-green-100 text-green-900'
                                }`}
                        >
                            <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded-full"
                            >
                                <X size={14} />
                            </button>
                            <p className="font-medium text-sm break-words">{note.content}</p>
                            <span className="text-[10px] opacity-60 mt-2 block">
                                {new Date(note.created_at).toLocaleDateString()}
                            </span>
                        </motion.div>
                    ))}
                </div>

                <div className="glass-card p-6 rounded-3xl">
                    <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-4">Nueva Nota</h3>
                    <div className="flex gap-2 mb-4">
                        {['yellow', 'pink', 'blue', 'green'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-stone-800 dark:border-stone-100 scale-110' : 'border-transparent'
                                    } ${c === 'yellow' ? 'bg-yellow-200' :
                                        c === 'pink' ? 'bg-pink-200' :
                                            c === 'blue' ? 'bg-blue-200' : 'bg-green-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Escribe algo bonito..."
                        className="w-full p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border-none focus:ring-2 focus:ring-soft-blush/50 mb-4 h-24 resize-none dark:text-stone-100"
                    />
                    <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="w-full bg-stone-800 dark:bg-stone-900 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                        Guardar Nota
                    </button>
                </div>
            </div>
        </div>
    );
};
