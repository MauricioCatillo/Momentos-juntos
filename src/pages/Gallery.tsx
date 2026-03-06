import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, Loader2, Play, Search, Filter, Video } from 'lucide-react';
import { getAllMemories } from '../supabaseClient';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

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
                toast.error('No se pudo cargar la galeria.');
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

    const imageCount = memories.filter((memory) => memory.media_type === 'image').length;
    const videoCount = memories.filter((memory) => memory.media_type === 'video').length;

    return (
        <div className="page-shell">
            <PageHeader kicker="Recuerdos" title="Galeria" />

            <section className="section-card rounded-[1.9rem] p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Filtros</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-stone-900 dark:text-stone-100">
                            Buscar
                        </h2>
                    </div>

                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-200">
                        <ImageIcon size={20} />
                    </div>
                </div>

                <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Buscar por titulo o descripcion"
                        className="input-shell has-icon-sm"
                    />
                </div>

                <div className="scrollbar-hide mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                    <div className="inline-flex items-center gap-1 rounded-full bg-white/65 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:bg-white/6 dark:text-stone-300">
                        <Filter size={12} />
                        Tipo
                    </div>

                    <button
                        onClick={() => setFilter('all')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${filter === 'all' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'section-card'}`}
                    >
                        Todo ({memories.length})
                    </button>
                    <button
                        onClick={() => setFilter('image')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${filter === 'image' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'section-card'}`}
                    >
                        Fotos ({imageCount})
                    </button>
                    <button
                        onClick={() => setFilter('video')}
                        className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${filter === 'video' ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : 'section-card'}`}
                    >
                        Videos ({videoCount})
                    </button>
                </div>
            </section>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-rose-500" size={32} />
                </div>
            ) : filteredMemories.length === 0 ? (
                <EmptyState
                    title="Sin resultados"
                    description="Cambia el filtro o busca otra palabra."
                    icon={<ImageIcon size={28} className="text-rose-500 dark:text-rose-200" />}
                />
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {filteredMemories.map((memory, index) => (
                        <motion.button
                            key={memory.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => setSelectedItem(memory)}
                            className="group section-card relative overflow-hidden rounded-[1.45rem] p-0 text-left"
                        >
                            <div className="relative aspect-[0.82] overflow-hidden bg-stone-100 dark:bg-white/6">
                                {memory.media_type === 'video' ? (
                                    memory.external_url ? (
                                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-stone-900 to-stone-700 text-white">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                                                <Video size={20} />
                                            </div>
                                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
                                                Video externo
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <video
                                                src={memory.media_url}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                muted
                                                loop
                                                playsInline
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/18">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md">
                                                    <Play size={15} className="ml-0.5 fill-current" />
                                                </div>
                                            </div>
                                        </>
                                    )
                                ) : (
                                    <img
                                        src={memory.media_url}
                                        alt={memory.title || 'Recuerdo'}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                )}

                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
                                    <p className="text-sm font-semibold text-white">{memory.title || 'Sin titulo'}</p>
                                    {memory.description && (
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{memory.description}</p>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4 backdrop-blur-xl"
                        onClick={() => setSelectedItem(null)}
                    >
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                            aria-label="Cerrar"
                        >
                            <X size={20} />
                        </button>

                        <motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                            className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-[1.8rem] bg-black"
                            onClick={(event) => event.stopPropagation()}
                        >
                            {selectedItem.media_type === 'video' ? (
                                selectedItem.external_url ? (
                                    <iframe
                                        src={getDriveEmbedUrl(selectedItem.external_url)}
                                        className="h-[60vh] w-full"
                                        allow="autoplay; fullscreen"
                                        title={selectedItem.title}
                                    />
                                ) : (
                                    <video
                                        src={selectedItem.media_url}
                                        controls
                                        autoPlay
                                        className="max-h-[72vh] w-full bg-black object-contain"
                                    />
                                )
                            ) : (
                                <img
                                    src={selectedItem.media_url}
                                    alt={selectedItem.title}
                                    className="max-h-[72vh] w-full bg-black object-contain"
                                />
                            )}

                            <div className="bg-black/88 px-4 py-4 text-white">
                                <h3 className="text-lg font-semibold">{selectedItem.title || 'Sin titulo'}</h3>
                                {selectedItem.description && (
                                    <p className="mt-2 text-sm leading-6 text-white/75">{selectedItem.description}</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
