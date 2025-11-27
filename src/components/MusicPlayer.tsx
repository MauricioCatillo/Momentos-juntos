import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, X, Disc, Play, Pause } from 'lucide-react';

export const MusicPlayer: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setIsPlaying(false);

        if (audio) {
            audio.addEventListener('ended', handleEnded);
            return () => audio.removeEventListener('ended', handleEnded);
        }
    }, []);

    return (
        <div className="flex justify-end">
            <audio ref={audioRef} src="/music/LET THE WORLD BURN.mp3" />

            <AnimatePresence mode="wait">
                {!isExpanded ? (
                    <motion.button
                        key="collapsed"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsExpanded(true)}
                        className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-stone-600 border border-white/50"
                    >
                        <motion.div
                            animate={{ rotate: isPlaying ? 360 : 0 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                            <Disc size={24} />
                        </motion.div>
                    </motion.button>
                ) : (
                    <motion.div
                        key="expanded"
                        className="glass-card rounded-3xl p-4 overflow-hidden w-full max-w-sm bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-rose-500">
                                <Music size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Nuestra Canción</span>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 hover:bg-black/5 rounded-full text-stone-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-md bg-stone-200 flex-shrink-0">
                                <div className={`absolute inset-0 bg-rose-500/20 flex items-center justify-center ${isPlaying ? 'animate-pulse' : ''}`}>
                                    <Music size={24} className="text-rose-500" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-stone-800 truncate">LET THE WORLD BURN</h3>
                                <p className="text-sm text-stone-500 truncate">Chris Grey</p>
                            </div>

                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors flex-shrink-0"
                            >
                                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
