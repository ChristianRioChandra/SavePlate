/* eslint-disable */
import admin from 'firebase-admin'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

// Netlify env vars (no filesystem access — everything comes from process.env)
const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables')
}

let serviceAccount

const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT
if (FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT)
} else {
  // Local fallback for local development
  const localPath = path.resolve(process.cwd(), 'firebaseServiceAccount.json')
  if (fs.existsSync(localPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'))
  } else {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable and no local firebaseServiceAccount.json found')
  }
}

// Initialise Firebase Admin (only once across warm invocations)
if (!admin.apps.length) {
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
