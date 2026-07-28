import { supabase } from './config'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export async function getAuthDebugInfo() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return { session: 'erro', error: error.message }
  if (!data.session) return { session: 'ausente' }
  const claims = decodeJwt(data.session.access_token)
  return {
    session: 'presente',
    role: claims?.role ?? 'desconhecido',
    uid: data.session.user?.id,
    expira_em_s: Math.round(data.session.expires_at - Date.now() / 1000),
  }
}

async function ensureFreshSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    throw new Error('Sessão ausente — faça login novamente antes de enviar.')
  }
  const expiresInMs = data.session.expires_at * 1000 - Date.now()
  if (expiresInMs < 60_000) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshed.session) {
      throw new Error('Não foi possível renovar a sessão — faça login novamente.')
    }
  }
}

export async function uploadCheckinFoto(desafioId, checkinId, blob) {
  await ensureFreshSession()
  const path = `${desafioId}/${checkinId}.jpg`
  const { error } = await supabase.storage
    .from('checkins')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return supabase.storage.from('checkins').getPublicUrl(path).data.publicUrl
}

export async function uploadFotoPerfil(uid, blob) {
  await ensureFreshSession()
  const path = `${uid}.jpg`
  const { error } = await supabase.storage
    .from('perfis')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  return supabase.storage.from('perfis').getPublicUrl(path).data.publicUrl
}
