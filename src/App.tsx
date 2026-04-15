import React, { Suspense, useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { supabase } from './supabaseClient';
import { isPreviewModeEnabled } from './lib/previewMode';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Memories = React.lazy(() => import('./pages/Memories').then(module => ({ default: module.Memories })));
const More = React.lazy(() => import('./pages/More').then(module => ({ default: module.More })));
const Story = React.lazy(() => import('./pages/Story').then(module => ({ default: module.Story })));
const Daily = React.lazy(() => import('./pages/Daily').then(module => ({ default: module.Daily })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Chat = React.lazy(() => import('./pages/Chat').then(module => ({ default: module.Chat })));
const BucketList = React.lazy(() => import('./pages/BucketList').then(module => ({ default: module.BucketList })));
const Gallery = React.lazy(() => import('./pages/Gallery').then(module => ({ default: module.Gallery })));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-transparent">
    <Loader2 className="animate-spin text-rose-400" size={48} />
  </div>
);

const NotificationBootstrap = () => {
    const { user } = useApp();
    const oneSignalInitialized = useRef(false);

    useEffect(() => {
        if (isPreviewModeEnabled() || !user) {
            return;
        }

        const notificationsAvailable = typeof window !== 'undefined' && 'Notification' in window;
        const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const shouldInitOneSignal =
            notificationsAvailable &&
            window.isSecureContext &&
            (!isLocalhost || import.meta.env.VITE_ENABLE_LOCAL_ONESIGNAL === 'true');

        if (!shouldInitOneSignal) {
            return;
        }

        let cancelled = false;
        let onesignal: typeof import('react-onesignal').default | null = null;
        let foregroundListener: ((event: { notification: { display: () => void } }) => void) | null = null;
        let subscriptionListener: ((event: { current: { id?: string | null } }) => void) | null = null;
        let idleCallbackId: number | null = null;
        let timeoutId: ReturnType<typeof window.setTimeout> | null = null;

        const savePlayerId = async (id: string | undefined | null) => {
            if (!id) return;

            await supabase.from('player_ids').upsert({
                user_id: user.id,
                player_id: id,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
        };

        const runOneSignal = async () => {
            if (oneSignalInitialized.current || cancelled) return;

            try {
                const { default: OneSignal } = await import('react-onesignal');
                if (cancelled || oneSignalInitialized.current) return;

                onesignal = OneSignal;
                oneSignalInitialized.current = true;

                await OneSignal.init({
                    appId: '4eba265f-72e0-414a-a9b4-7bffdd1e56d7',
                    allowLocalhostAsSecureOrigin: true,
                    serviceWorkerPath: '/OneSignalSDKWorker.js',
                    serviceWorkerParam: { scope: '/' },
                });

                foregroundListener = (event) => {
                    event.notification.display();
                };
                OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener);

                await savePlayerId(OneSignal.User.PushSubscription.id);

                subscriptionListener = (event) => {
                    void savePlayerId(event.current.id);
                };
                OneSignal.User.PushSubscription.addEventListener('change', subscriptionListener);
            } catch (error) {
                oneSignalInitialized.current = false;
                console.error('OneSignal init error:', error);
            }
        };

        if ('requestIdleCallback' in window) {
            idleCallbackId = window.requestIdleCallback(() => {
                void runOneSignal();
            }, { timeout: 2000 });
        } else {
            timeoutId = window.setTimeout(() => {
                void runOneSignal();
            }, 1200);
        }

        return () => {
            cancelled = true;

            if (idleCallbackId !== null && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleCallbackId);
            }

            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }

            if (foregroundListener) {
                onesignal?.Notifications.removeEventListener?.('foregroundWillDisplay', foregroundListener);
            }

            if (subscriptionListener) {
                onesignal?.User.PushSubscription.removeEventListener?.('change', subscriptionListener);
            }
        };
    }, [user]);

    return null;
};

function App() {

  return (
    <AppProvider>
      <NotificationBootstrap />
      <Toaster position="top-center" richColors />
      <BrowserRouter>
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Home />} />
                <Route path="memories" element={<Memories />} />
                <Route path="more" element={<More />} />
                <Route path="story" element={<Story />} />
                <Route path="daily" element={<Daily />} />
                <Route path="chat" element={<Chat />} />
                <Route path="wishlist" element={<BucketList />} />
                <Route path="gallery" element={<Gallery />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
