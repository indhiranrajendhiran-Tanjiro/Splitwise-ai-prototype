// lib/firebase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Firebase initialisation
// Replace the firebaseConfig values with your own project credentials from
// https://console.firebase.google.com → Project settings → Your apps → Web app
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? 'REPLACE_ME',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'REPLACE_ME',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? 'REPLACE_ME',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'REPLACE_ME',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'REPLACE_ME',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? 'REPLACE_ME',
}

// Prevent duplicate initialisation in Next.js hot-reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
