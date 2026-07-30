import { useEffect } from 'react'
import { supabase } from '../supabase/config'
import { listenUser } from '../supabase/db'
import { useStore } from '../store/useStore'

function withUid(user) {
  return user ? { ...user, uid: user.id } : null
}

export function useAuth() {
  const { user, userProfile, setUser, setUserProfile, setPasswordRecovery } = useStore()

  useEffect(() => {
    let unsubProfile = null

    function handleUser(sessionUser) {
      setUser(withUid(sessionUser))
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }
      if (sessionUser) {
        unsubProfile = listenUser(sessionUser.id, setUserProfile)
      } else {
        setUserProfile(null)
      }
    }

    supabase.auth.getSession().then(({ data }) => handleUser(data.session?.user ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        return
      }
      handleUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  return { user, userProfile }
}
