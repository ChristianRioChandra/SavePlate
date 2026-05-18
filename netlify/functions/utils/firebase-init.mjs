/* eslint-disable */
import admin from 'firebase-admin'
import nodemailer from 'nodemailer'

// Netlify env vars (no filesystem access — everything comes from process.env)
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

// Firebase service account is stored as a single JSON string in env
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables')
}

if (!FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable')
}

// Initialise Firebase Admin (only once across warm invocations)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
})

const LOGO_URL = 'https://pantrypal-bit216.netlify.app/logo-fullwhite.png'

export { admin, db, transporter, GMAIL_USER, LOGO_URL }
