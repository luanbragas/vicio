import { supabase } from './config'

function rowToCheckin(row) {
  return { ...row, userId: row.user_id }
}

// ── Users ──────────────────────────────────────────────────────────────────
export function listenUser(uid, cb) {
  async function fetchAndEmit() {
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle()
    if (error) return console.error('listenUser error:', error)
    cb(data)
  }
  fetchAndEmit()
  const channel = supabase
    .channel(`user-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, fetchAndEmit)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export async function getUser(uid) {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle()
  if (error) throw error
  return data
}

export async function getUserByEmail(email) {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle()
  if (error) throw error
  return data
}

export async function updateUserProfile(uid, data) {
  const { error } = await supabase.from('users').update(data).eq('id', uid)
  if (error) throw error
}

// ── Desafios ──────────────────────────────────────────────────────────────
export async function criarDesafio(data) {
  const { data: row, error } = await supabase
    .from('desafios')
    .insert({
      titulo: data.titulo,
      participantes: data.participantes,
      criado_por: data.criado_por,
      aceitos: data.aceitos,
      duracao_dias: data.duracao_dias,
      aposta: data.aposta,
    })
    .select()
    .single()
  if (error) throw error
  return row.id
}

export function listenDesafiosDoUsuario(uid, cb) {
  async function fetchAndEmit() {
    const { data, error } = await supabase
      .from('desafios')
      .select('*')
      .contains('participantes', [uid])
      .order('criado_em', { ascending: false })
    if (error) return console.error('listenDesafiosDoUsuario error:', error)
    cb(data)
  }
  fetchAndEmit()
  const channel = supabase
    .channel(`desafios-${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'desafios' }, fetchAndEmit)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export async function aceitarDesafio(desafioId, uid) {
  const { data: desafio, error: e1 } = await supabase.from('desafios').select('*').eq('id', desafioId).single()
  if (e1) throw e1

  const aceitos = [...(desafio.aceitos || []), uid]
  const update = { aceitos }
  if (aceitos.length >= desafio.participantes.length) {
    update.status = 'ativo'
    const streakInit = {}
    desafio.participantes.forEach(p => (streakInit[p] = 0))
    update.streak_atual_por_usuario = streakInit
  }

  const { error: e2 } = await supabase.from('desafios').update(update).eq('id', desafioId)
  if (e2) throw e2
}

export async function deletarDesafio(id) {
  const { error: e1 } = await supabase.from('checkins').delete().eq('desafio_id', id)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('desafios').delete().eq('id', id)
  if (e2) throw e2
}

export async function getDesafio(id) {
  const { data, error } = await supabase.from('desafios').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export function listenDesafio(id, cb) {
  async function fetchAndEmit() {
    const { data, error } = await supabase.from('desafios').select('*').eq('id', id).maybeSingle()
    if (error) return console.error('listenDesafio error:', error)
    cb(data)
  }
  fetchAndEmit()
  const channel = supabase
    .channel(`desafio-${id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'desafios', filter: `id=eq.${id}` }, fetchAndEmit)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── Check-ins ─────────────────────────────────────────────────────────────
export async function criarCheckin(desafioId, data) {
  const { data: row, error } = await supabase
    .from('checkins')
    .insert({
      desafio_id: desafioId,
      user_id: data.userId,
      foto_url: data.foto_url,
      horario_inicio: data.horario_inicio,
      horario_fim: data.horario_fim,
      duracao_minutos: data.duracao_minutos,
    })
    .select()
    .single()
  if (error) throw error
  return row.id
}

export function listenCheckins(desafioId, cb) {
  async function fetchAndEmit() {
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('desafio_id', desafioId)
      .order('criado_em', { ascending: false })
    if (error) return console.error('listenCheckins error:', error)
    cb(data.map(rowToCheckin))
  }
  fetchAndEmit()
  const channel = supabase
    .channel(`checkins-${desafioId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `desafio_id=eq.${desafioId}` }, fetchAndEmit)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export async function avaliarCheckin(desafioId, checkinId, avaliadorId, aprovado, motivo) {
  const { data: checkin, error: e1 } = await supabase.from('checkins').select('*').eq('id', checkinId).single()
  if (e1) throw e1

  const { error: e2 } = await supabase
    .from('checkins')
    .update({
      status: aprovado ? 'aprovado' : 'reprovado',
      avaliado_por: avaliadorId,
      motivo_reprovacao: motivo || null,
      avaliado_em: new Date().toISOString(),
    })
    .eq('id', checkinId)
  if (e2) throw e2

  const { data: desafio, error: e3 } = await supabase
    .from('desafios')
    .select('streak_atual_por_usuario')
    .eq('id', desafioId)
    .single()
  if (e3) throw e3

  const streaks = { ...(desafio.streak_atual_por_usuario || {}) }
  streaks[checkin.user_id] = aprovado ? (streaks[checkin.user_id] || 0) + 1 : 0

  const { error: e4 } = await supabase
    .from('desafios')
    .update({ streak_atual_por_usuario: streaks })
    .eq('id', desafioId)
  if (e4) throw e4
}

export async function usarStreakFreeze(desafioId, uid) {
  const { data: desafio, error: e1 } = await supabase.from('desafios').select('*').eq('id', desafioId).single()
  if (e1) throw e1

  const freezes = desafio.streak_freezes || {}
  const usado = desafio.streak_freezes_usados || {}
  const weekKey = getWeekKey()

  if ((usado[uid]?.[weekKey] || 0) >= 1) throw new Error('Freeze já utilizado esta semana')

  const novoUsado = { ...usado, [uid]: { ...(usado[uid] || {}), [weekKey]: ((usado[uid]?.[weekKey]) || 0) + 1 } }
  const novoFreezes = { ...freezes, [uid]: (freezes[uid] || 0) + 1 }

  const { error: e2 } = await supabase
    .from('desafios')
    .update({ streak_freezes: novoFreezes, streak_freezes_usados: novoUsado })
    .eq('id', desafioId)
  if (e2) throw e2
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
  const { error } = await supabase.from('convites').insert({ de: fromUid, para_email: toEmail })
  if (error) throw error
}

export function listenConvitesRecebidos(email, cb) {
  async function fetchAndEmit() {
    const { data, error } = await supabase
      .from('convites')
      .select('*')
      .eq('para_email', email)
      .eq('status', 'pendente')
    if (error) return console.error('listenConvitesRecebidos error:', error)
    cb(data)
  }
  fetchAndEmit()
  const channel = supabase
    .channel(`convites-${email}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'convites', filter: `para_email=eq.${email}` }, fetchAndEmit)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export async function aceitarConvite(conviteId) {
  const { error } = await supabase.rpc('accept_convite', { convite_id: conviteId })
  if (error) throw error
}
