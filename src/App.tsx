import React, { Suspense, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Story = React.lazy(() => import('./pages/Story').then(module => ({ default: module.Story })));
const Daily = React.lazy(() => import('./pages/Daily').then(module => ({ default: module.Daily })));
const Future = React.lazy(() => import('./pages/Future').then(module => ({ default: module.Future })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-transparent">
    <Loader2 className="animate-spin text-rose-400" size={48} />
  </div>
);

function App() {
  useEffect(() => {
    const runOneSignal = async () => {
      try {
        console.log("Initializing OneSignal...");
        await OneSignal.init({
          appId: "b1cec79b-98e6-4881-ae74-8b626d302e15",
          allowLocalhostAsSecureOrigin: true,
          // Add these for debugging
          notifyButton: {
            enable: true,
          },
        });
        console.log("OneSignal Init Success");

        // Log initial state
        console.log("Initial ID:", OneSignal.User.PushSubscription.id);
        console.log("Initial OptedIn:", OneSignal.User.PushSubscription.optedIn);

        // Listen for changes
        OneSignal.User.PushSubscription.addEventListener("change", (event) => {
          console.log("OneSignal Subscription Changed:", event);
        });

        // Request permission immediately as requested
        await OneSignal.Slidedown.promptPush();
      } catch (error) {
        console.error("OneSignal init error:", error);
      }
    };

    runOneSignal();
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
                <Route path="story" element={<Story />} />
                <Route path="daily" element={<Daily />} />
                <Route path="future" element={<Future />} />
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
