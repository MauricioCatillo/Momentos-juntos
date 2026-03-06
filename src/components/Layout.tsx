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
        <div className="relative min-h-screen min-h-[100dvh] overflow-hidden md:px-5 md:py-5">
            <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-36 bg-gradient-to-b from-white/22 to-transparent md:block" />

            <div className="relative mx-auto flex min-h-screen min-h-[100dvh] w-full max-w-[28rem] flex-col overflow-hidden bg-[color:var(--surface-1)] md:min-h-[calc(100dvh-2.5rem)] md:max-h-[58rem] md:rounded-[2rem] md:border md:border-white/50 md:shadow-[0_32px_90px_rgba(77,42,55,0.24)] dark:md:border-white/10">
                <div
                    className={`relative flex-1 ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto overscroll-y-contain'}`}
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
