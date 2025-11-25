import React from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

interface MusicPlayerProps {
    spotifyUrl: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ spotifyUrl }) => {
    return (
        <motion.div
            className="glass-card rounded-3xl p-1 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-2 px-4 py-2 text-stone-600">
                <Music size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Nuestra Canción</span>
            </div>
            <iframe
                style={{ borderRadius: '12px' }}
                src={spotifyUrl}
                width="100%"
                height="80"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
            />
        </motion.div>
    );
};
