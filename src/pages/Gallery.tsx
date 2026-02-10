import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, Loader2, Play, Search, Filter, Video } from 'lucide-react';
import { getAllMemories } from '../supabaseClient';
import { toast } from 'sonner';

interface Memory {
    id: string;
    media_url?: string;
    external_url?: string;
    media_type: 'image' | 'video';
    title: string;
    description?: string;
    created_at: string;
}

type MediaFilter = 'all' | 'image' | 'video';

const getDriveEmbedUrl = (url: string) => {
    if (url.includes('/view')) return url.replace('/view', '/preview');
    return url;
};

export const Gallery: React.FC = () => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<Memory | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<MediaFilter>('all');

    useEffect(() => {
        const loadMemories = async () => {
            try {
                const data = await getAllMemories();
                setMemories(data || []);
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar la galeria');
            } finally {
                setIsLoading(false);
            }
        };

        void loadMemories();
    }, []);

    useEffect(() => {
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedItem(null);
        };

        window.addEventListener('keydown', onEscape);
        return () => window.removeEventListener('keydown', onEscape);
    }, []);

    const filteredMemories = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return memories.filter((memory) => {
            const matchesFilter = filter === 'all' || memory.media_type === filter;
            if (!matchesFilter) return false;

            if (!term) return true;

            const title = memory.title?.toLowerCase() || '';
            const description = memory.description?.toLowerCase() || '';
            return title.includes(term) || description.includes(term);
        });
    }, [memories, filter, searchTerm]);

    const imageCount = memories.filter((m) => m.media_type === 'image').length;
    const videoCount = memories.filter((m) => m.media_type === 'video').length;

    return (
        <div className="page-shell">
            <header className="page-header">
                <h1 className="page-title flex items-center gap-2">
                    <ImageIcon className="text-rose-500" />
                    Galeria de recuerdos
                </h1>
                <p className="page-subtitle">
                    Busca, filtra y vuelve rapido a tus momentos favoritos.
                </p>
            </header>

            <div className="glass-card rounded-2xl p-3 mb-4 space-y-3">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por titulo o descripcion"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <div className="flex items-center gap-1 text-stone-400 text-xs font-semibold uppercase">
                        <Filter size={12} />
                        Tipo
                    </div>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300'}`}
                    >
                        Todo ({memories.length})
                    </button>
                    <button
                        onClick={() => setFilter('image')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === 'image' ? 'bg-stone-800 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300'}`}
                    >
                        Fotos ({imageCount})
                    </button>
                    <button
                        onClick={() => setFilter('video')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === 'video' ? 'bg-stone-800 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300'}`}
                    >
                        Videos ({videoCount})
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-rose-500" size={32} />
                </div>
            ) : filteredMemories.length === 0 ? (
                <div className="text-center py-20 opacity-70">
                    <p>No se encontraron recuerdos con ese filtro.</p>
                </div>
            ) : (
                <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                    {filteredMemories.map((memory, index) => (
                        <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in shadow-md"
                            onClick={() => setSelectedItem(memory)}
                        >
                            {memory.media_type === 'video' ? (
                                memory.external_url ? (
                                    <div className="relative aspect-video bg-black/10 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="mx-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                                                <Video size={18} className="text-white" />
                                            </div>
                                            <p className="text-xs text-white/90">Video externo</p>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    </div>
                                ) : (
                                    <div className="relative aspect-video bg-black/10">
                                        <video
                                            src={memory.media_url}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            playsInline
                                            onMouseOver={(e) => e.currentTarget.play()}
                                            onMouseOut={(e) => e.currentTarget.pause()}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
                                            <div className="w-8 h-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                                                <Play size={14} className="text-white fill-white ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <img
                                    src={memory.media_url}
                                    alt={memory.title || 'Recuerdo'}
                                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-xs font-medium truncate">{memory.title}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4"
                        onClick={() => setSelectedItem(null)}
                    >
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            aria-label="Cerrar"
                        >
                            <X size={24} />
                        </button>

                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            className="relative max-w-full max-h-[90vh] w-auto h-auto rounded-lg overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {selectedItem.media_type === 'video' ? (
                                selectedItem.external_url ? (
                                    <iframe
                                        src={getDriveEmbedUrl(selectedItem.external_url)}
                                        className="w-[90vw] max-w-[900px] h-[60vh]"
                                        allow="autoplay; fullscreen"
                                        title={selectedItem.title}
                                    />
                                ) : (
                                    <video
                                        src={selectedItem.media_url}
                                        controls
                                        autoPlay
                                        className="max-h-[85vh] max-w-full w-auto"
                                    />
                                )
                            ) : (
                                <img
                                    src={selectedItem.media_url}
                                    alt={selectedItem.title}
                                    className="max-h-[85vh] max-w-full w-auto object-contain"
                                />
                            )}

                            {selectedItem.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 text-white">
                                    <h3 className="text-lg font-bold">{selectedItem.title}</h3>
                                    {selectedItem.description && <p className="text-sm opacity-80">{selectedItem.description}</p>}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
