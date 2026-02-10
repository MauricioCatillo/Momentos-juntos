import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useApp } from '../context/AppContext';
import { PWAInstallBanner } from './PWAInstallBanner';
import { SwipeablePages } from './SwipeablePages';

export const Layout: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const isChatPage = location.pathname === '/chat';

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
        <div className="min-h-screen min-h-[100dvh] flex justify-center lg:items-center lg:py-10">
            {/* Mobile: Full Screen | Desktop: Floating Phone */}
            <div className="w-full max-w-md bg-stone-50 dark:bg-stone-900 min-h-screen min-h-[100dvh] h-[100dvh] lg:min-h-[850px] lg:h-[850px] lg:max-h-[90vh] lg:rounded-[3rem] lg:shadow-2xl lg:border-[8px] lg:border-white/30 dark:lg:border-stone-800/30 relative overflow-hidden flex flex-col transition-all duration-500">

                {/* Content Area with Scroll */}
                <div
                    className={`flex-1 scrollbar-hide ${isChatPage ? 'overflow-hidden pb-0' : 'overflow-y-auto'}`}
                >
                    <SwipeablePages>
                        <Outlet />
                    </SwipeablePages>
                </div>

                {!isChatPage && <BottomNav />}

                {/* PWA Install Banner */}
                {!isChatPage && <PWAInstallBanner />}
            </div>
        </div>
    );
};

