import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

export async function uploadCheckinFoto(desafioId, checkinId, blob) {
  const path = `checkins/${desafioId}/${checkinId}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

export async function uploadFotoPerfil(uid, blob) {
  const path = `perfis/${uid}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}
