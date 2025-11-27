import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useApp } from '../context/AppContext';
import { MusicPlayer } from './MusicPlayer';

export const Layout: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
    }, [user, navigate]);

    if (!user) {
        return null; // Or a loading spinner
    }

    return (
        <div className="min-h-screen flex justify-center lg:items-center lg:py-10">
            {/* Mobile: Full Screen | Desktop: Floating Phone */}
            <div className="w-full max-w-md bg-stone-50 dark:bg-stone-900 min-h-screen lg:min-h-[850px] lg:h-[850px] lg:max-h-[90vh] lg:rounded-[3rem] lg:shadow-2xl lg:border-[8px] lg:border-white/30 dark:lg:border-stone-800/30 relative overflow-hidden flex flex-col transition-all duration-500">

                {/* Content Area with Scroll */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-32">
                    <Outlet />
                </div>

                {/* Fixed Bottom Elements inside the container */}
                <div className="absolute bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>

                <div className="absolute bottom-24 left-0 right-0 z-40 px-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <MusicPlayer />
                    </div>
                </div>
            </div>
        </div>
    );
};
