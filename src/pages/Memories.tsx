import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Image as ImageIcon, Loader2, Play, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllMemories } from '../supabaseClient';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';

interface Memory {
    id: string;
    title: string;
    description?: string;
    media_url?: string;
    external_url?: string;
    media_type: 'image' | 'video';
    created_at: string;
}

const ShortcutCard = ({
    title,
    gradient,
    icon: Icon,
    onClick,
}: {
    title: string;
    gradient: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-[0_20px_42px_rgba(0,0,0,0.2)]`}
    >
        <div className="absolute right-[-1rem] top-[-1rem] h-20 w-20 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/70">Vista</p>
                <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                <Icon size={20} />
            </div>
        </div>
    </motion.button>
);

export const Memories: React.FC = () => {
    const navigate = useNavigate();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMemories = async () => {
            try {
                const data = await getAllMemories();
                setMemories(data || []);
            } catch (error) {
                console.error(error);
                toast.error('No se pudieron cargar los recuerdos.');
            } finally {
                setIsLoading(false);
            }
        };

        void loadMemories();
    }, []);

    const stats = useMemo(() => {
        const photos = memories.filter((memory) => memory.media_type === 'image').length;
        const videos = memories.filter((memory) => memory.media_type === 'video').length;

        return {
            total: memories.length,
            photos,
            videos,
        };
    }, [memories]);

    const recentMemories = useMemo(() => memories.slice(0, 4), [memories]);

    return (
        <div className="page-shell">
            <PageHeader
                kicker="Recuerdos"
                title="Todo en un solo lugar"
            />

            <section className="section-card rounded-[1.9rem] p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="section-label">Resumen</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-[color:var(--text-primary)]">
                            Su espacio de recuerdos
                        </h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-400 dark:bg-rose-500/10">
                        <Heart size={20} />
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <p className="section-label">Total</p>
                        <p className="mt-3 text-2xl font-black text-[color:var(--text-primary)]">{stats.total}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <p className="section-label">Fotos</p>
                        <p className="mt-3 text-2xl font-black text-[color:var(--text-primary)]">{stats.photos}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <p className="section-label">Videos</p>
                        <p className="mt-3 text-2xl font-black text-[color:var(--text-primary)]">{stats.videos}</p>
                    </div>
                </div>
            </section>

            <section className="grid gap-3">
                <ShortcutCard
                    title="Historia"
                    gradient="from-rose-500 to-pink-600"
                    icon={Heart}
                    onClick={() => navigate('/story')}
                />
                <ShortcutCard
                    title="Galeria"
                    gradient="from-amber-500 to-orange-600"
                    icon={ImageIcon}
                    onClick={() => navigate('/gallery')}
                />
            </section>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-[color:var(--accent)]" size={32} />
                </div>
            ) : recentMemories.length === 0 ? (
                <EmptyState
                    title="Sin recuerdos aun"
                    description="Empieza creando una carpeta o subiendo una foto desde Historia."
                    icon={<Heart size={28} className="text-[color:var(--accent)]" />}
                />
            ) : (
                <section className="space-y-3">
                    <div className="px-1">
                        <p className="section-label">Ultimos recuerdos</p>
                        <h2 className="display-font mt-2 text-[2rem] leading-none text-[color:var(--text-primary)]">
                            Lo mas reciente
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {recentMemories.map((memory) => (
                            <button
                                key={memory.id}
                                onClick={() => navigate('/gallery')}
                                className="section-card overflow-hidden rounded-[1.5rem] p-0 text-left"
                            >
                                <div className="relative aspect-[0.9] bg-[color:var(--surface-2)]">
                                    {memory.media_type === 'image' && memory.media_url ? (
                                        <img
                                            src={memory.media_url}
                                            alt={memory.title}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[color:var(--surface-2)] to-[color:var(--surface-3)] text-[color:var(--text-secondary)]">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                                                {memory.external_url ? <Video size={20} /> : <Play size={18} className="ml-0.5 fill-current" />}
                                            </div>
                                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                                                {memory.external_url ? 'Video externo' : 'Video'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8">
                                        <p className="text-sm font-semibold text-white">{memory.title}</p>
                                        {memory.description && (
                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{memory.description}</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
