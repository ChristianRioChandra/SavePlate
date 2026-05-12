// firebase.ts

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import {
  initializeFirestore,
  memoryLocalCache
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Services
export const analytics =
  typeof window !== 'undefined' && import.meta.env.PROD ? getAnalytics(app) : null
export const auth = getAuth(app)

// Use memory cache to avoid IndexedDB locks/offline errors during development
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true
})

// Ensure auth survives page reloads (prevents user becoming null on refresh)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set Firebase Auth persistence:', error)
})

export default app
