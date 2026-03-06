import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, getNotes, addNote, deleteNote } from '../supabaseClient';
import { useApp } from '../context/AppContext';
import { sendPushNotification } from '../utils/notifications';
import { EmptyState } from './ui/EmptyState';
import { isPreviewModeEnabled } from '../lib/previewMode';

interface Note {
    id: string;
    content: string;
    color: string;
    created_at: string;
    author?: string;
}

const COLORS = ['bg-yellow-200', 'bg-rose-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200'];

interface StickyNotesProps {
    title?: string;
    showPushNotification?: boolean;
}

export const StickyNotes: React.FC<StickyNotesProps> = ({
    title = 'Tablon de notas',
    showPushNotification = false,
}) => {
    const { user } = useApp();
    const previewMode = isPreviewModeEnabled();
    const [notes, setNotes] = useState<Note[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const closeAddModal = () => {
        setIsAdding(false);
        setNewNote('');
        setSelectedColor(COLORS[0]);
    };

    useEffect(() => {
        const loadNotes = async () => {
            try {
                const data = await getNotes();
                setNotes(data as Note[]);
            } catch (error) {
                console.error('Error loading notes:', error);
            }
        };

        void loadNotes();

        if (previewMode) {
            return;
        }

        const channel = supabase
            .channel('notes_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notes' },
                (payload) => {
                    const insertedNote = payload.new as Note;
                    setNotes((prev) => {
                        if (prev.some((note) => note.id === insertedNote.id)) return prev;
                        return [insertedNote, ...prev];
                    });

                    if (user && insertedNote.author && insertedNote.author !== user.id) {
                        toast.success('Nueva nota recibida.');
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'notes' },
                (payload) => {
                    const deletedId = payload.old.id;
                    setNotes((prev) => prev.filter((note) => note.id !== deletedId));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [previewMode, user]);

    const handleAdd = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!newNote.trim()) return;

        if (previewMode) {
            const note = {
                id: `preview-note-${Date.now()}`,
                content: newNote.trim(),
                color: selectedColor,
                author: user?.id ?? 'anonymous',
                created_at: new Date().toISOString(),
            };
            setNotes((prev) => [note, ...prev]);
            closeAddModal();
            toast.success('Nota agregada.');
            return;
        }

        try {
            const note = await addNote(newNote.trim(), selectedColor, user?.id ?? 'anonymous');
            setNotes((prev) => {
                if (prev.some((item) => item.id === note.id)) return prev;
                return [note, ...prev];
            });
            closeAddModal();
            toast.success('Nota agregada.');

            if (showPushNotification) {
                void sendPushNotification('Hay una nueva nota.').catch((error) => {
                    console.error('Error sending note notification:', error);
                });
            }
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error('No se pudo guardar la nota.');
        }
    };

    const handleDelete = async (id: string) => {
        if (previewMode) {
            setNotes((prev) => prev.filter((note) => note.id !== id));
            return;
        }

        try {
            await deleteNote(id);
            setNotes((prev) => prev.filter((note) => note.id !== id));
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('No se pudo eliminar la nota.');
        }
    };

    return (
        <section className="section-card rounded-[1.95rem] p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <p className="section-label">Notas</p>
                    <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                        {title}
                    </h2>
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-lg dark:bg-white dark:text-stone-900"
                >
                    <Plus size={18} />
                </button>
            </div>

            {notes.length === 0 ? (
                <EmptyState
                    title="Sin notas"
                    description="Agrega una."
                    icon={<StickyNote size={24} className="text-yellow-700 dark:text-yellow-200" />}
                    className="border border-dashed border-stone-300/80 dark:border-white/10"
                />
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <AnimatePresence>
                        {notes.map((note, index) => (
                            <motion.article
                                key={note.id}
                                layout
                                initial={{ opacity: 0, y: 12, rotate: index % 2 === 0 ? -2 : 2 }}
                                animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -2 : 2 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                className={`${note.color} relative min-h-[9rem] rounded-[1.45rem] p-4 shadow-[0_18px_30px_rgba(66,54,28,0.12)]`}
                                style={{ colorScheme: 'light' }}
                            >
                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-black/10"
                                >
                                    <X size={14} />
                                </button>

                                <p className="script-font pr-7 text-[1.3rem] leading-7 text-stone-800">
                                    {note.content}
                                </p>

                                <span className="absolute bottom-3 right-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-stone-500">
                                    {new Date(note.created_at).toLocaleDateString()}
                                </span>
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop"
                        onClick={closeAddModal}
                    >
                        <motion.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            onClick={(event) => event.stopPropagation()}
                            className="modal-card"
                        >
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="section-label">Nueva nota</p>
                                    <h3 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                                        Nueva nota
                                    </h3>
                                </div>
                                <button
                                    onClick={closeAddModal}
                                    className="rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAdd}>
                                <textarea
                                    value={newNote}
                                    onChange={(event) => setNewNote(event.target.value)}
                                    className="textarea-shell min-h-[8rem]"
                                    rows={4}
                                    placeholder="Escribe algo corto, dulce o importante..."
                                    autoFocus
                                />

                                <div className="mt-4 flex gap-2">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`h-9 w-9 rounded-full ${color} border-2 ${selectedColor === color ? 'border-stone-700' : 'border-transparent'}`}
                                        />
                                    ))}
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <button type="button" onClick={closeAddModal} className="secondary-button px-4">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="primary-button px-4">
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
