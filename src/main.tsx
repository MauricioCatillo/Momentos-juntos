import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/caveat/700.css'
import './index.css'
import App from './App.tsx'

import { registerSW } from 'virtual:pwa-register'

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
} else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      void registration.unregister()
    })
  })

  if ('caches' in window) {
    void caches.keys().then((cacheKeys) => {
      cacheKeys.forEach((cacheKey) => {
        void caches.delete(cacheKey)
      })
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
