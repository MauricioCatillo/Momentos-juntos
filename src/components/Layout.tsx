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
        }
    }, [user, navigate]);

    if (!user) {
        return null;
    }

    return (
        <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden md:px-5 md:py-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-36 bg-gradient-to-b from-white/8 to-transparent md:block" />
            <div className="pointer-events-none absolute inset-x-6 top-5 h-24 rounded-[2rem] bg-white/10 blur-3xl md:hidden" />

            <div className="relative mx-auto flex h-screen h-[100dvh] w-full max-w-[28rem] flex-col bg-[color:var(--surface-1)]/50 backdrop-blur-sm md:h-auto md:min-h-[calc(100dvh-2.5rem)] md:max-h-[58rem] md:overflow-hidden md:rounded-[2.2rem] md:border md:border-white/[0.08] md:shadow-[0_32px_90px_rgba(0,0,0,0.25)] dark:md:border-white/[0.06]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/12 via-white/5 to-transparent dark:from-white/6 dark:via-transparent" />
                <div
                    className={`relative min-h-0 flex-1 ${isChatPage ? 'overflow-hidden' : 'app-scroll-region'}`}
                >
                    <SwipeablePages>
                        <Outlet />
                    </SwipeablePages>
                </div>

                {!isChatPage && <BottomNav />}
                {!isChatPage && <PWAInstallBanner />}
            </div>
        </div>
    );
};
