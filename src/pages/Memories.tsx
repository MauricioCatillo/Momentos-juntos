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
    helper,
    gradient,
    icon: Icon,
    onClick,
}: {
    title: string;
    helper: string;
    gradient: string;
    icon: React.ComponentType<{ size?: number }>;
    onClick: () => void;
}) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-[1.7rem] bg-gradient-to-br ${gradient} p-5 text-left text-white shadow-[0_18px_42px_rgba(48,31,22,0.18)]`}
    >
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/12 blur-2xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/70">Vista</p>
                <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
                <p className="mt-4 text-sm leading-6 text-white/78">{helper}</p>
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
                subtitle="Tus fotos, videos y momentos importantes con una navegacion mas clara."
            />

            <section className="hero-panel">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="hero-kicker">Biblioteca</p>
                        <h2 className="display-font mt-3 text-[2.5rem] leading-[0.94] text-white">
                            Guardado con mas calma y mejor lectura.
                        </h2>
                    </div>
                    <div className="hero-chip shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/88">
                        <Heart size={12} className="fill-current" />
                        {stats.total} piezas
                    </div>
                </div>

                <p className="mt-4 max-w-[16rem] text-sm leading-6 text-white/78">
                    Mira lo ultimo, salta a historia o entra a la galeria sin perderte entre pantallas.
                </p>

                <div className="mt-5 metric-strip">
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Total</p>
                        <p className="mt-2 text-base font-semibold text-white">{stats.total}</p>
                    </div>
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Fotos</p>
                        <p className="mt-2 text-base font-semibold text-white">{stats.photos}</p>
                    </div>
                    <div className="metric-card">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/64">Videos</p>
                        <p className="mt-2 text-base font-semibold text-white">{stats.videos}</p>
                    </div>
                </div>
            </section>

            <section className="grid gap-3">
                <ShortcutCard
                    title="Historia"
                    helper="Recorre carpetas, subidas y la linea de recuerdos."
                    gradient="from-[#402024] via-[#824754] to-[#cf8579]"
                    icon={Heart}
                    onClick={() => navigate('/story')}
                />
                <ShortcutCard
                    title="Galeria"
                    helper="Ver todo en formato visual y filtrar rapido desde el telefono."
                    gradient="from-[#6a4727] via-[#b37648] to-[#d8ac7c]"
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
                                className="section-card overflow-hidden rounded-[1.6rem] p-0 text-left"
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
                                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#2b1817] to-[#60453c] text-white">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/12 backdrop-blur-md">
                                                {memory.external_url ? <Video size={20} /> : <Play size={18} className="ml-0.5 fill-current" />}
                                            </div>
                                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/76">
                                                {memory.external_url ? 'Video externo' : 'Video'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 to-transparent px-3 pb-3 pt-8">
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
