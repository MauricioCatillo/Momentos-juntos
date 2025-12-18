import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, X, Loader2, Play, ZoomIn } from 'lucide-react';
import { getAllMemories } from '../supabaseClient';
import { toast } from 'sonner';

interface Memory {
    id: string;
    media_url: string;
    media_type: 'image' | 'video';
    title: string;
    description?: string;
    created_at: string;
}

export const Gallery: React.FC = () => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<Memory | null>(null);

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        try {
            const data = await getAllMemories();
            setMemories(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar la galería');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen">
            <header className="mb-6 px-2">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    <Image className="text-rose-500" />
                    Galería de Recuerdos
                </h1>
                <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
                    Cada momento juntos es un tesoro 📸
                </p>
            </header>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-rose-500" size={32} />
                </div>
            ) : memories.length === 0 ? (
                <div className="text-center py-20 opacity-60">
                    <p>Aún no hay fotos en los álbumes.</p>
                </div>
            ) : (
                <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                    {memories.map((memory, index) => (
                        <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in shadow-md"
                            onClick={() => setSelectedImage(memory)}
                        >
                            {memory.media_type === 'video' ? (
                                <div className="relative aspect-video bg-black/10">
                                    <video
                                        src={memory.media_url}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        onMouseOver={e => e.currentTarget.play()}
                                        onMouseOut={e => e.currentTarget.pause()}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
                                        <div className="w-8 h-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                                            <Play size={14} className="text-white fill-white ml-0.5" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={memory.media_url}
                                    alt={memory.title || 'Recuerdo'}
                                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-xs font-medium truncate">{memory.title}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-full max-h-[90vh] w-auto h-auto rounded-lg overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {selectedImage.media_type === 'video' ? (
                                <video
                                    src={selectedImage.media_url}
                                    controls
                                    autoPlay
                                    className="max-h-[85vh] max-w-full w-auto"
                                />
                            ) : (
                                <img
                                    src={selectedImage.media_url}
                                    alt={selectedImage.title}
                                    className="max-h-[85vh] max-w-full w-auto object-contain"
                                />
                            )}
                            {selectedImage.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 text-white">
                                    <h3 className="text-lg font-bold">{selectedImage.title}</h3>
                                    {selectedImage.description && <p className="text-sm opacity-80">{selectedImage.description}</p>}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
