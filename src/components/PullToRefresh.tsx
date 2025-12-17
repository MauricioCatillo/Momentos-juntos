import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => Promise<void>;
    threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    children,
    onRefresh,
    threshold = 80,
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isDragging = useRef(false);

    const y = useMotionValue(0);
    const opacity = useTransform(y, [0, threshold], [0, 1]);
    const scale = useTransform(y, [0, threshold], [0.5, 1]);
    const rotate = useTransform(y, [0, threshold * 2], [0, 360]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const container = containerRef.current;
        if (!container || isRefreshing) return;

        // Only activate if scrolled to top
        if (container.scrollTop <= 0) {
            startY.current = e.touches[0].clientY;
            isDragging.current = true;
        }
    }, [isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current || isRefreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            isDragging.current = false;
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = Math.max(0, currentY - startY.current);

        // Apply resistance
        const resistance = 0.4;
        const pullDistance = diff * resistance;

        y.set(pullDistance);

        // Prevent scroll while pulling
        if (diff > 10) {
            e.preventDefault();
        }
    }, [isRefreshing, y]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        const currentY = y.get();

        if (currentY >= threshold && !isRefreshing) {
            setIsRefreshing(true);

            // Animate to loading position
            await animate(y, 60, { duration: 0.2 });

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh error:', error);
            }

            setIsRefreshing(false);
        }

        // Reset position
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }, [threshold, isRefreshing, onRefresh, y]);

    return (
        <div
            ref={containerRef}
            className="relative h-full overflow-y-auto overflow-x-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull Indicator */}
            <motion.div
                style={{ opacity, scale, y: useTransform(y, v => v - 50) }}
                className="absolute left-1/2 -translate-x-1/2 top-4 z-50 pointer-events-none"
            >
                <motion.div
                    style={{ rotate: isRefreshing ? undefined : rotate }}
                    className="w-10 h-10 bg-white dark:bg-stone-800 rounded-full shadow-lg flex items-center justify-center border border-rose-100 dark:border-stone-700"
                >
                    <motion.div
                        animate={isRefreshing ? { rotate: 360 } : {}}
                        transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                    >
                        <Loader2
                            size={20}
                            className={`text-rose-500 ${isRefreshing ? 'animate-spin' : ''}`}
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div style={{ y }}>
                {children}
            </motion.div>
        </div>
    );
};
