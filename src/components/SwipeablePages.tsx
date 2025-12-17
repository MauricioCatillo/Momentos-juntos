import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';

interface SwipeablePagesProps {
    children: React.ReactNode;
}

// Order of pages for swipe navigation (chat is not swiped to, only via icon)
const PAGE_ORDER = ['/', '/story', '/daily', '/future'];

export const SwipeablePages: React.FC<SwipeablePagesProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { trigger } = useHaptic();

    const x = useMotionValue(0);
    const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

    const currentIndex = PAGE_ORDER.indexOf(location.pathname);

    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 80;
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        // Determine direction based on velocity and offset
        if (Math.abs(velocity) > 300 || Math.abs(offset) > threshold) {
            if (offset > 0 && currentIndex > 0) {
                // Swipe right -> go to previous page
                trigger('light');
                navigate(PAGE_ORDER[currentIndex - 1]);
            } else if (offset < 0 && currentIndex < PAGE_ORDER.length - 1) {
                // Swipe left -> go to next page
                trigger('light');
                navigate(PAGE_ORDER[currentIndex + 1]);
            }
        }

        // Reset position
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }, [currentIndex, navigate, trigger, x]);

    // Don't enable swipe on chat page
    if (location.pathname === '/chat') {
        return <>{children}</>;
    }

    return (
        <motion.div
            style={{ x, opacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="h-full"
        >
            {children}
        </motion.div>
    );
};
