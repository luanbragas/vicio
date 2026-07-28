import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Camera, Shield, Star, Trophy, Flame, Edit3, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'
import { logout } from '../firebase/auth'
import { updateUserProfile } from '../firebase/firestore'
import { uploadFotoPerfil } from '../firebase/storage'
import Avatar from '../components/Avatar'
import Button from '../components/Button'

export default function Perfil() {
  const { user, userProfile } = useStore()
  const [editingNome, setEditingNome] = useState(false)
  const [nome, setNome] = useState('')
  const [loadingFoto, setLoadingFoto] = useState(false)
  const fileRef = useRef(null)

  async function handleLogout() {
    await logout()
    toast('Até logo!')
  }

  async function handleSaveNome() {
    if (!nome.trim()) return setEditingNome(false)
    try {
      await updateUserProfile(user.uid, { nome: nome.trim() })
      toast.success('Nome atualizado!')
    } catch {
      toast.error('Erro ao salvar')
    }
    setEditingNome(false)
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoadingFoto(true)
    try {
      const url = await uploadFotoPerfil(user.uid, file)
      await updateUserProfile(user.uid, { foto_perfil: url })
      toast.success('Foto atualizada!')
    } catch {
      toast.error('Erro ao enviar foto')
    } finally {
      setLoadingFoto(false)
    }
  }

  const taxaAprovacao = userProfile?.taxa_aprovacao || 100
  const totalCheckins = userProfile?.total_checkins || 0

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>Perfil</h1>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', color: 'var(--red)',
              fontSize: 13, fontWeight: 600, border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <LogOut size={14} /> Sair
          </motion.button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Avatar src={userProfile?.foto_perfil} nome={userProfile?.nome} size={96} />
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg)',
              }}
            >
              {loadingFoto
                ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                : <Camera size={14} color="#fff" />
              }
            </motion.button>
            <input ref={fileRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleFotoChange} />
          </div>

          {/* Nome editável */}
          {editingNome ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="input"
                autoFocus
                value={nome}
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveNome()}
                style={{ padding: '8px 12px', textAlign: 'center', fontSize: 20, fontWeight: 800 }}
              />
              <motion.button whileTap={{ scale: 0.85 }} onClick={handleSaveNome}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Check size={16} color="#fff" />
              </motion.button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900 }}>{userProfile?.nome}</h2>
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => { setNome(userProfile?.nome || ''); setEditingNome(true) }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Edit3 size={12} color="var(--text3)" />
              </motion.button>
            </div>
          )}
          <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{user?.email}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          <StatCard icon={<Flame size={20} color="var(--accent)" />} value={userProfile?.streak_atual || 0} label="Streak" />
          <StatCard icon={<Shield size={20} color="var(--green)" />} value={`${taxaAprovacao}%`} label="Aprovação" />
          <StatCard icon={<Trophy size={20} color="var(--yellow)" />} value={totalCheckins} label="Check-ins" />
        </div>

        {/* Selo de honestidade */}
        <motion.div
          className="card"
          style={{
            background: taxaAprovacao >= 90
              ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))'
              : 'var(--bg2)',
            border: taxaAprovacao >= 90 ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
          }}
        >
          <Star size={24} color={taxaAprovacao >= 90 ? 'var(--green)' : 'var(--text3)'} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Selo de Honestidade</p>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>
              {taxaAprovacao >= 90
                ? 'Sua taxa de aprovação é excelente! 🏆'
                : `Taxa atual: ${taxaAprovacao}% — mantenha a qualidade!`
              }
            </p>
          </div>
        </motion.div>

        {/* Multiplicador visual */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', marginBottom: 12 }}>EVOLUÇÃO DA CHAMA</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {[
              { label: '1d', color: '#ff4d00', streak: 1 },
              { label: '7d', color: '#ff7a00', streak: 7 },
              { label: '21d', color: '#60a5fa', streak: 21 },
              { label: '50d', color: '#fbbf24', streak: 50 },
            ].map(({ label, streak }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ opacity: (userProfile?.streak_atual || 0) >= streak ? 1 : 0.3 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <path d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11z"
                      fill={[null, '#ff4d00', '#ff7a00', '#60a5fa', '#fbbf24'][[0, 1, 7, 21, 50].indexOf(streak)]}
                    />
                    <path d="M12 10c0 0-2 3-2 5a2 2 0 004 0c0-2-2-5-2-5z" fill="rgba(255,255,255,0.35)" />
                  </svg>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function StatCard({ icon, value, label }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: 22, fontWeight: 900 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</p>
    </div>
  )
}
