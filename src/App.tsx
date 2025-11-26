import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
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
  return (
    <AppProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
