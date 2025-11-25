import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreaksWidgetProps {
    count: number;
}

export const StreaksWidget: React.FC<StreaksWidgetProps> = ({ count }) => {
    return (
        <motion.div
            className="flex items-center gap-2 bg-orange-100/80 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-200 shadow-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
        >
            <Flame size={18} className="text-orange-500 fill-orange-500 animate-pulse" />
            <span className="font-bold text-orange-700">{count}</span>
        </motion.div>
    );
};
