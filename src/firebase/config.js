import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyDkXB6YDSARPAQMcybGPTBLrRneANz2X2I",
  authDomain: "vicio-65b36.firebaseapp.com",
  projectId: "vicio-65b36",
  storageBucket: "vicio-65b36.firebasestorage.app",
  messagingSenderId: "404901427851",
  appId: "1:404901427851:web:4dba26775a42fe93aff28e",
  measurementId: "G-L8N9PSQJES"
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)
