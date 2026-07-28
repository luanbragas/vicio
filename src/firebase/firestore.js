import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  increment,
} from 'firebase/firestore'
import { db } from './config'

// ── Users ──────────────────────────────────────────────────────────────────
export function listenUser(uid, cb) {
  return onSnapshot(
    doc(db, 'users', uid),
    snap => cb({ id: snap.id, ...snap.data() }),
    err => console.error('listenUser error:', err)
  )
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getUserByEmail(email) {
  const q = query(collection(db, 'users'), where('email', '==', email))
  const snaps = await getDocs(q)
  if (snaps.empty) return null
  const d = snaps.docs[0]
  return { id: d.id, ...d.data() }
}

export async function addAmigo(myUid, amigoUid) {
  await updateDoc(doc(db, 'users', myUid), { amigos: arrayUnion(amigoUid) })
  await updateDoc(doc(db, 'users', amigoUid), { amigos: arrayUnion(myUid) })
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

// ── Desafios ──────────────────────────────────────────────────────────────
export async function criarDesafio(data) {
  const ref = await addDoc(collection(db, 'desafios'), {
    ...data,
    status: 'pendente',
    streak_atual_por_usuario: {},
    criado_em: serverTimestamp(),
  })
  return ref.id
}

export function listenDesafiosDoUsuario(uid, cb) {
  const q = query(
    collection(db, 'desafios'),
    where('participantes', 'array-contains', uid),
    orderBy('criado_em', 'desc')
  )
  return onSnapshot(
    q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('listenDesafiosDoUsuario error:', err)
  )
}

export async function aceitarDesafio(desafioId, uid) {
  const ref = doc(db, 'desafios', desafioId)
  const snap = await getDoc(ref)
  const data = snap.data()
  const aceitos = [...(data.aceitos || []), uid]
  const update = { aceitos }
  if (aceitos.length >= data.participantes.length) {
    update.status = 'ativo'
    const streakInit = {}
    data.participantes.forEach(p => (streakInit[p] = 0))
    update.streak_atual_por_usuario = streakInit
  }
  await updateDoc(ref, update)
}

export async function getDesafio(id) {
  const snap = await getDoc(doc(db, 'desafios', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function listenDesafio(id, cb) {
  return onSnapshot(
    doc(db, 'desafios', id),
    snap => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    err => console.error('listenDesafio error:', err)
  )
}

// ── Check-ins ─────────────────────────────────────────────────────────────
export async function criarCheckin(desafioId, data) {
  const ref = await addDoc(collection(db, 'desafios', desafioId, 'checkins'), {
    ...data,
    status: 'pendente',
    criado_em: serverTimestamp(),
  })
  return ref.id
}

export function listenCheckins(desafioId, cb) {
  const q = query(
    collection(db, 'desafios', desafioId, 'checkins'),
    orderBy('criado_em', 'desc')
  )
  return onSnapshot(
    q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('listenCheckins error:', err)
  )
}

export async function avaliarCheckin(desafioId, checkinId, avaliadorId, aprovado, motivo) {
  const checkinRef = doc(db, 'desafios', desafioId, 'checkins', checkinId)
  const checkinSnap = await getDoc(checkinRef)
  const checkin = checkinSnap.data()

  await updateDoc(checkinRef, {
    status: aprovado ? 'aprovado' : 'reprovado',
    avaliado_por: avaliadorId,
    motivo_reprovacao: motivo || null,
    avaliado_em: serverTimestamp(),
  })

  const desafioRef = doc(db, 'desafios', desafioId)
  if (aprovado) {
    await updateDoc(desafioRef, {
      [`streak_atual_por_usuario.${checkin.userId}`]: increment(1),
    })
  } else {
    await updateDoc(desafioRef, {
      [`streak_atual_por_usuario.${checkin.userId}`]: 0,
    })
  }
}

export async function usarStreakFreeze(desafioId, uid) {
  const ref = doc(db, 'desafios', desafioId)
  const snap = await getDoc(ref)
  const data = snap.data()
  const freezes = data.streak_freezes || {}
  const usado = data.streak_freezes_usados || {}

  const weekKey = getWeekKey()
  if ((usado[uid]?.[weekKey] || 0) >= 1) throw new Error('Freeze já utilizado esta semana')

  await updateDoc(ref, {
    [`streak_freezes.${uid}`]: (freezes[uid] || 0) + 1,
    [`streak_freezes_usados.${uid}.${weekKey}`]: ((usado[uid]?.[weekKey]) || 0) + 1,
  })
}

function getWeekKey() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
  return `${now.getFullYear()}-W${week}`
}

// ── Convites ──────────────────────────────────────────────────────────────
export async function criarConvite(fromUid, toEmail) {
  return addDoc(collection(db, 'convites'), {
    de: fromUid,
    para_email: toEmail,
    status: 'pendente',
    criado_em: serverTimestamp(),
  })
}

export function listenConvitesRecebidos(email, cb) {
  const q = query(
    collection(db, 'convites'),
    where('para_email', '==', email),
    where('status', '==', 'pendente')
  )
  return onSnapshot(
    q,
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error('listenConvitesRecebidos error:', err)
  )
}

export async function aceitarConvite(conviteId, myUid) {
  const ref = doc(db, 'convites', conviteId)
  const snap = await getDoc(ref)
  const { de } = snap.data()
  await addAmigo(myUid, de)
  await updateDoc(ref, { status: 'aceito' })
}
