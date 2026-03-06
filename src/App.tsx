import React, { Suspense, useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
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

function App() {
    const oneSignalInitialized = useRef(false);

    useEffect(() => {
        if (isPreviewModeEnabled()) {
            return;
        }

        let foregroundListener: ((event: { notification: { display: () => void } }) => void) | null = null;
        let subscriptionListener: ((event: { current: { id?: string | null } }) => void) | null = null;

    const runOneSignal = async () => {
      if (oneSignalInitialized.current) return;

      try {
        oneSignalInitialized.current = true;

        await OneSignal.init({
          appId: "4eba265f-72e0-414a-a9b4-7bffdd1e56d7",
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: '/' },
        });

        // Ensure notifications display even when app is in foreground
        foregroundListener = (event) => {
          event.notification.display();
        };
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener);

        // function to save player id
        const savePlayerId = async (id: string | undefined | null) => {
          if (!id) return;

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('player_ids').upsert({
              user_id: user.id,
              player_id: id,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          }
        };

        // Save Player ID to Supabase for targeted notifications
        // Check if we already have an ID
        await savePlayerId(OneSignal.User.PushSubscription.id);

        // Listen for future changes (e.g. after permission granted)
        subscriptionListener = (event) => {
          savePlayerId(event.current.id);
        };
        OneSignal.User.PushSubscription.addEventListener("change", subscriptionListener);

      } catch (error) {
        oneSignalInitialized.current = false;
        console.error("OneSignal init error:", error);
      }
    };

    runOneSignal();

    return () => {
      if (foregroundListener) {
        OneSignal.Notifications.removeEventListener?.('foregroundWillDisplay', foregroundListener);
      }
      if (subscriptionListener) {
        OneSignal.User.PushSubscription.removeEventListener?.('change', subscriptionListener);
      }
    };
  }, []);

  return (
    <AppProvider>
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
