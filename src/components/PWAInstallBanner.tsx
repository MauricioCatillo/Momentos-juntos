import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        return isStandalone || isIosStandalone;
    });

    useEffect(() => {
        if (isInstalled) return;

        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        let bannerTimeout: ReturnType<typeof setTimeout> | null = null;

        const handleBeforeInstall = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
            bannerTimeout = setTimeout(() => setShowBanner(true), 1800);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            if (bannerTimeout) clearTimeout(bannerTimeout);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, [isInstalled]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
        } catch (error) {
            console.error('Install error:', error);
        }

        setShowBanner(false);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    };

    if (isInstalled || !showBanner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="absolute inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-30"
            >
                <div className="rounded-[1.6rem] border border-white/70 bg-[rgba(255,252,250,0.88)] p-4 shadow-[0_22px_46px_rgba(84,43,58,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(26,22,32,0.92)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-400 text-white shadow-lg shadow-rose-500/25">
                            <Heart className="h-6 w-6 fill-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">Instala la app</p>

                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    onClick={handleInstall}
                                    className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 text-sm font-semibold text-white shadow-lg shadow-rose-500/25"
                                >
                                    <Download size={16} />
                                    Instalar
                                </button>

                                <button
                                    onClick={handleDismiss}
                                    className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-stone-200/80 px-4 text-sm font-medium text-stone-500 dark:border-white/10 dark:text-stone-300"
                                >
                                    Luego
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-black/5 hover:text-stone-600 dark:hover:bg-white/5 dark:hover:text-stone-200"
                            aria-label="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
