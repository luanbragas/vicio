import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal } from 'lucide-react'
import { useStore } from '../store/useStore'
import { listenDesafiosDoUsuario, getUser } from '../firebase/firestore'
import { MOCK_DESAFIOS, MOCK_RIVAL } from '../mock/data'
import FlameIcon from '../components/FlameIcon'
import Avatar from '../components/Avatar'

const PREVIEW_MODE = true
const MOCK_USER_PROFILE = { id: 'user-demo', nome: 'Luan', foto_perfil: null, streak_atual: 12 }

export default function Ranking() {
  const { user } = useStore()
  const [desafios, setDesafios] = useState([])
  const [players, setPlayers] = useState([])

  useEffect(() => {
    if (PREVIEW_MODE) {
      setDesafios(MOCK_DESAFIOS)
      const scoreMap = { 'user-demo': 17, 'rival-demo': 15 }
      setPlayers([
        { ...MOCK_USER_PROFILE, totalStreak: 17 },
        { ...MOCK_RIVAL, totalStreak: 15 },
      ])
      return
    }
    if (!user) return
    return listenDesafiosDoUsuario(user.uid, setDesafios)
  }, [user])

  useEffect(() => {
    if (PREVIEW_MODE) return
    if (!desafios.length) return
    const uidSet = new Set()
    desafios
      .filter(d => d.status === 'ativo')
      .forEach(d => d.participantes?.forEach(uid => uidSet.add(uid)))

    const uids = [...uidSet]
    Promise.all(uids.map(uid => getUser(uid))).then(users => {
      const scoreMap = {}
      desafios.filter(d => d.status === 'ativo').forEach(d => {
        d.participantes?.forEach(uid => {
          const s = d.streak_atual_por_usuario?.[uid] || 0
          scoreMap[uid] = (scoreMap[uid] || 0) + s
        })
      })

      const ranked = users
        .filter(Boolean)
        .map(u => ({ ...u, totalStreak: scoreMap[u.id] || 0 }))
        .sort((a, b) => b.totalStreak - a.totalStreak)

      setPlayers(ranked)
    })
  }, [desafios])

  const weeklyWinners = desafios
    .filter(d => d.status === 'ativo')
    .map(d => {
      const [a, b] = d.participantes || []
      const sA = d.streak_atual_por_usuario?.[a] || 0
      const sB = d.streak_atual_por_usuario?.[b] || 0
      return { desafio: d, winner: sA >= sB ? a : b, loser: sA < sB ? a : b }
    })

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Ranking</h1>

        {/* Top 3 podium */}
        {players.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 32, paddingTop: 20 }}
          >
            {[players[1], players[0], players[2]].map((p, i) => {
              const pos = [2, 1, 3][i]
              const height = [100, 130, 80][i]
              const colors = ['#9ca3af', '#fbbf24', '#cd7c2c']
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ textAlign: 'center', flex: 1 }}
                >
                  <Avatar src={p.foto_perfil} nome={p.nome} size={pos === 1 ? 60 : 48}
                    border={colors[pos - 1]}
                  />
                  <div style={{ marginTop: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.nome?.split(' ')[0]}
                    </p>
                    <FlameIcon streak={p.totalStreak} size={16} animate={false} />
                    <p style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{p.totalStreak}</p>
                  </div>
                  <div style={{
                    height, borderRadius: '8px 8px 0 0',
                    background: `linear-gradient(180deg, ${colors[pos-1]}33, ${colors[pos-1]}11)`,
                    border: `1px solid ${colors[pos-1]}44`,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: 10, marginTop: 8,
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: colors[pos - 1] }}>#{pos}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Full list */}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Classificação Geral
        </h2>

        {players.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
            <Trophy size={40} />
            <p style={{ marginTop: 12 }}>Nenhum dado ainda</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Comece desafios para aparecer no ranking</p>
          </div>
        )}

        {players.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card"
            style={{
              marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12,
              background: p.id === user?.uid ? 'rgba(255,77,0,0.06)' : 'var(--bg2)',
              border: p.id === user?.uid ? '1px solid rgba(255,77,0,0.2)' : '1px solid var(--border)',
            }}
          >
            <div style={{
              width: 28, fontWeight: 900, fontSize: 16, textAlign: 'center',
              color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2c' : 'var(--text3)',
            }}>
              {i < 3 ? <Medal size={20} /> : `#${i + 1}`}
            </div>
            <Avatar src={p.foto_perfil} nome={p.nome} size={40} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15 }}>
                {p.nome} {p.id === user?.uid && <span style={{ fontSize: 11, color: 'var(--accent)' }}>(você)</span>}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                {desafios.filter(d => d.status === 'ativo' && d.participantes?.includes(p.id)).length} desafios ativos
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <FlameIcon streak={p.totalStreak} size={18} animate={false} />
                <span style={{ fontSize: 22, fontWeight: 900 }} className={p.id === user?.uid ? 'gradient-text' : ''}>
                  {p.totalStreak}
                </span>
              </div>
              <p style={{ fontSize: 10, color: 'var(--text3)' }}>streak total</p>
            </div>
          </motion.div>
        ))}

        {/* Duelos semanais */}
        {weeklyWinners.length > 0 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 12 }}>
              Liderando no duelo
            </h2>
            {weeklyWinners.map(({ desafio: d, winner }) => (
              <div key={d.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trophy size={16} color="var(--yellow)" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>{d.titulo}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {winner === user?.uid ? 'Você está na frente!' : 'Rival está na frente'}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
