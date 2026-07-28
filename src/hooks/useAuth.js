import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { listenUser } from '../firebase/firestore'
import { useStore } from '../store/useStore'
import { PREVIEW_MODE } from '../App'

export function useAuth() {
  const { user, userProfile, setUser, setUserProfile } = useStore()

  useEffect(() => {
    // Em preview, o App.jsx já injeta o mock — não conectar no Firebase
    if (PREVIEW_MODE) return

    let unsubProfile = null

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null)
      if (unsubProfile) unsubProfile()
      if (firebaseUser) {
        unsubProfile = listenUser(firebaseUser.uid, setUserProfile)
      } else {
        setUserProfile(null)
      }
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  return { user, userProfile }
}
