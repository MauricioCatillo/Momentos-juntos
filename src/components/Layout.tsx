import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useApp } from '../context/AppContext';
import { MusicPlayer } from './MusicPlayer';
import { getAppSettings } from '../supabaseClient';

export const Layout: React.FC = () => {
    const { user, logout } = useApp();
    const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchSettings = async () => {
            try {
                const settings = await getAppSettings();
                if (settings.music_url) {
                    // Handle both string URL and JSON object formats
                    let url = settings.music_url;
                    if (typeof url === 'object' && url.url) {
                        url = url.url;
                    }
                    setSpotifyUrl(url);
                } else {
                    // Default fallback if DB is empty/error
                    setSpotifyUrl('https://open.spotify.com/embed/track/2VxeLyX666F8uXCJ0dZF8B?utm_source=generator');
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                // Default fallback on error
                setSpotifyUrl('https://open.spotify.com/embed/track/2VxeLyX666F8uXCJ0dZF8B?utm_source=generator');
            }
        };

        fetchSettings();
    }, [user, navigate]);

    if (!user) {
        return null; // Or a loading spinner
    }

    return (
        <div className="min-h-screen flex justify-center lg:items-center lg:py-10">
            {/* Mobile: Full Screen | Desktop: Floating Phone */}
            <div className="w-full max-w-md bg-stone-50 min-h-screen lg:min-h-[850px] lg:h-[850px] lg:max-h-[90vh] lg:rounded-[3rem] lg:shadow-2xl lg:border-[8px] lg:border-white/30 relative overflow-hidden flex flex-col transition-all duration-500">

                {/* Content Area with Scroll */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
                    <Outlet />
                </div>

                {/* Fixed Bottom Elements inside the container */}
                <div className="absolute bottom-0 left-0 right-0 z-50">
                    <BottomNav />
                </div>

                {/* Logout Button */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={logout}
                        className="p-2 bg-white/50 backdrop-blur-md rounded-full text-stone-500 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                        title="Cerrar Sesión"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>

                {spotifyUrl && (
                    <div className="absolute bottom-24 left-0 right-0 z-40 px-4 pointer-events-none">
                        <div className="pointer-events-auto">
                            <MusicPlayer spotifyUrl={spotifyUrl} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
