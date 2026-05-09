// firebase.js

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'

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
export const analytics = getAnalytics(app)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Ensure auth survives page reloads (prevents user becoming null on refresh)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set Firebase Auth persistence:', error)
})

// Cache Firestore data locally so refreshes still show recent inventory instantly.
enableIndexedDbPersistence(db).catch((error: { code?: string }) => {
  if (error?.code === 'failed-precondition') {
    enableMultiTabIndexedDbPersistence(db).catch((multiTabError) => {
      console.error('Failed to enable multi-tab Firestore persistence:', multiTabError)
    })
    return
  }
  if (error?.code === 'unimplemented') {
    console.warn('Firestore persistence unavailable in this browser.')
    return
  }
  console.error('Failed to enable Firestore persistence:', error)
})

export default app
