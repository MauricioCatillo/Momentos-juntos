import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, StickyNote } from 'lucide-react';
import { getNotes, addNote, deleteNote } from '../supabaseClient';

interface Note {
    id: string;
    content: string;
    color: string;
    created_at: string;
}

const COLORS = ['bg-yellow-200', 'bg-rose-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200'];

export const StickyNotes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const data = await getNotes();
            setNotes(data as Note[]);
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            const note = await addNote(newNote, selectedColor);
            setNotes([note, ...notes]);
            setNewNote('');
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteNote(id);
            setNotes(notes.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-stone-600">
                    <StickyNote size={20} />
                    <h3 className="font-bold text-lg">Pizarrón de Notas</h3>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                    {notes.map((note) => (
                        <motion.div
                            key={note.id}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className={`${note.color} p-4 rounded-xl shadow-sm relative group min-h-[120px] flex flex-col justify-between transform rotate-1 hover:rotate-0 transition-transform duration-300`}
                        >
                            <p className="font-handwriting text-stone-800 text-sm leading-relaxed break-words">{note.content}</p>
                            <button
                                onClick={() => handleDelete(note.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded-full"
                            >
                                <X size={14} />
                            </button>
                            <span className="text-[10px] text-black/40 self-end mt-2">
                                {new Date(note.created_at).toLocaleDateString()}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <h3 className="font-bold text-lg mb-4">Nueva Nota</h3>
                            <form onSubmit={handleAdd}>
                                <textarea
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                    className="w-full bg-stone-50 rounded-xl p-4 mb-4 resize-none focus:ring-2 focus:ring-rose-200 outline-none"
                                    rows={3}
                                    placeholder="Escribe algo bonito..."
                                    autoFocus
                                />

                                <div className="flex gap-2 mb-6">
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-8 h-8 rounded-full ${color} border-2 ${selectedColor === color ? 'border-stone-400' : 'border-transparent'}`}
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 py-3 rounded-xl bg-stone-100 font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 rounded-xl bg-stone-800 text-white font-medium"
                                    >
                                        Pegar Nota
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
