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
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem('pwa-banner-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Small delay for better UX
            setTimeout(() => setShowBanner(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

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
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-24 left-4 right-4 z-[60] max-w-md mx-auto"
            >
                <div className="bg-white/90 dark:bg-stone-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-rose-100 dark:border-stone-700 p-4 relative overflow-hidden">
                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-transparent to-purple-50/50 dark:from-rose-900/20 dark:to-purple-900/20 pointer-events-none" />

                    <div className="relative flex items-center gap-4">
                        {/* App Icon */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
                            <Heart className="w-7 h-7 text-white fill-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                                Añade Mi Prometida 💕
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                Instala la app en tu pantalla de inicio
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleInstall}
                                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <Download size={16} />
                                Instalar
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                                aria-label="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
