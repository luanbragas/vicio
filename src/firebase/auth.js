import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

const googleProvider = new GoogleAuthProvider()

export async function loginGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  await ensureUserDoc(result.user)
  return result.user
}

export async function loginEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function registerEmail(email, password, nome) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName: nome })
  await ensureUserDoc(result.user, nome)
  return result.user
}

export async function logout() {
  await signOut(auth)
}

async function ensureUserDoc(user, nome) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      nome: nome || user.displayName || user.email.split('@')[0],
      email: user.email,
      foto_perfil: user.photoURL || null,
      amigos: [],
      streak_atual: 0,
      criado_em: serverTimestamp(),
    })
  }
}
