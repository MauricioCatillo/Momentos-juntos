import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Plus, X, StickyNote, Trash2 } from 'lucide-react';
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

const NOTE_ACCENTS = [
    { bg: 'bg-rose-500/10 dark:bg-rose-500/8', border: 'border-l-rose-400', dot: 'bg-rose-400' },
    { bg: 'bg-violet-500/10 dark:bg-violet-500/8', border: 'border-l-violet-400', dot: 'bg-violet-400' },
    { bg: 'bg-sky-500/10 dark:bg-sky-500/8', border: 'border-l-sky-400', dot: 'bg-sky-400' },
    { bg: 'bg-emerald-500/10 dark:bg-emerald-500/8', border: 'border-l-emerald-400', dot: 'bg-emerald-400' },
    { bg: 'bg-amber-500/10 dark:bg-amber-500/8', border: 'border-l-amber-400', dot: 'bg-amber-400' },
];

const COLOR_OPTIONS = [
    { id: 'rose', class: 'bg-rose-400', value: 'bg-rose-200' },
    { id: 'violet', class: 'bg-violet-400', value: 'bg-purple-200' },
    { id: 'sky', class: 'bg-sky-400', value: 'bg-blue-200' },
    { id: 'emerald', class: 'bg-emerald-400', value: 'bg-green-200' },
    { id: 'amber', class: 'bg-amber-400', value: 'bg-yellow-200' },
];

function getAccentForColor(color: string): typeof NOTE_ACCENTS[number] {
    if (color.includes('rose') || color.includes('pink')) return NOTE_ACCENTS[0];
    if (color.includes('purple') || color.includes('violet') || color.includes('indigo')) return NOTE_ACCENTS[1];
    if (color.includes('blue') || color.includes('sky') || color.includes('cyan')) return NOTE_ACCENTS[2];
    if (color.includes('green') || color.includes('emerald') || color.includes('teal')) return NOTE_ACCENTS[3];
    return NOTE_ACCENTS[4]; // amber/yellow default
}

function getRelativeTime(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `hace ${days}d`;
    return new Date(dateStr).toLocaleDateString();
}

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
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);

    useEffect(() => {
        if (!isAdding || typeof window === 'undefined') {
            return;
        }

        const handleViewportChange = () => {
            window.requestAnimationFrame(() => {
                const focusedElement = document.activeElement as HTMLElement | null;
                focusedElement?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
            });
        };

        window.visualViewport?.addEventListener('resize', handleViewportChange);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleViewportChange);
        };
    }, [isAdding]);

    const closeAddModal = () => {
        setIsAdding(false);
        setNewNote('');
        setSelectedColor(COLOR_OPTIONS[0].value);
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

    const addModal =
        isAdding && typeof document !== 'undefined'
            ? createPortal(
                <AnimatePresence>
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
                                    <h3 className="display-font mt-2 text-[2rem] leading-none text-[color:var(--text-primary)]">
                                        Escribe algo
                                    </h3>
                                </div>
                                <button
                                    onClick={closeAddModal}
                                    className="rounded-full p-2 text-[color:var(--text-tertiary)] transition-colors hover:bg-white/10 hover:text-[color:var(--text-primary)]"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-4">
                                <textarea
                                    value={newNote}
                                    onChange={(event) => setNewNote(event.target.value)}
                                    rows={4}
                                    placeholder="Escribe algo corto, dulce o importante..."
                                    autoFocus
                                    onFocus={() => {
                                        window.requestAnimationFrame(() => {
                                            const focusedElement = document.activeElement as HTMLElement | null;
                                            focusedElement?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
                                        });
                                    }}
                                    className="textarea-shell min-h-[6.5rem]"
                                />

                                <div className="flex flex-wrap gap-2">
                                    {COLOR_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSelectedColor(opt.value)}
                                            className={`h-9 w-9 rounded-full ${opt.class} border-2 transition-all ${selectedColor === opt.value ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        />
                                    ))}
                                </div>

                                <div className="sticky bottom-0 grid grid-cols-2 gap-3 bg-[color:var(--surface-1)] pb-1 pt-4">
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
                </AnimatePresence>,
                document.body
            )
            : null;

    return (
        <>
            <section className="section-card rounded-[1.95rem] p-5">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Notas</p>
                        <h2 className="display-font mt-2 max-w-[12rem] text-[1.72rem] leading-[0.95] text-[color:var(--text-primary)] sm:max-w-none sm:text-[2rem]">
                            {title}
                        </h2>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setIsAdding(true)}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--accent)] to-[#c44490] text-white shadow-lg glow-accent"
                    >
                        <Plus size={18} />
                    </motion.button>
                </div>

                {notes.length === 0 ? (
                    <EmptyState
                        title="Sin notas"
                        description="Agrega una."
                        icon={<StickyNote size={24} className="text-[color:var(--accent)]" />}
                        className="border border-dashed border-white/10 dark:border-white/[0.06]"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <AnimatePresence>
                            {notes.map((note, index) => {
                                const accent = getAccentForColor(note.color);
                                return (
                                    <motion.article
                                        key={note.id}
                                        layout
                                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.04 }}
                                        className={`group relative min-h-[7rem] overflow-hidden rounded-2xl border border-white/10 ${accent.bg} border-l-[3px] ${accent.border} p-4 backdrop-blur-sm dark:border-white/[0.06]`}
                                    >
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--text-tertiary)] opacity-0 transition-all hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                                        >
                                            <Trash2 size={13} />
                                        </button>

                                        <p className="pr-7 text-[0.92rem] leading-6 text-[color:var(--text-primary)]">
                                            {note.content}
                                        </p>

                                        <div className="mt-3 flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                                            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-tertiary)]">
                                                {getRelativeTime(note.created_at)}
                                            </span>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </section>
            {addModal}
        </>
    );
};
