import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

// Import OneSignal SDK Worker
importScripts('OneSignalSDKWorker.js')
