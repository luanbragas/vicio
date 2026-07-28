import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Bell, CheckCircle2, Clock, XCircle, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'
import { listenDesafiosDoUsuario, aceitarDesafio, listenConvitesRecebidos, aceitarConvite, criarConvite } from '../supabase/db'
import FlameIcon from '../components/FlameIcon'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Modal from '../components/Modal'

const STATUS_ICON = {
  aprovado: <CheckCircle2 size={14} color="var(--green)" />,
  reprovado: <XCircle size={14} color="var(--red)" />,
  pendente: <Clock size={14} color="var(--yellow)" />,
}

export default function Home() {
  const { user, userProfile } = useStore()
  const navigate = useNavigate()
  const [desafios, setDesafios] = useState([])
  const [convites, setConvites] = useState([])
  const [showAmigo, setShowAmigo] = useState(false)
  const [emailAmigo, setEmailAmigo] = useState('')
  const [loadingAmigo, setLoadingAmigo] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub1 = listenDesafiosDoUsuario(user.uid, setDesafios)
    const unsub2 = listenConvitesRecebidos(user.email, setConvites)
    return () => { unsub1(); unsub2() }
  }, [user])

  async function handleAceitarDesafio(id) {
    try {
      await aceitarDesafio(id, user.uid)
      toast.success('Desafio aceito!')
    } catch {
      toast.error('Erro ao aceitar desafio')
    }
  }

  async function handleEnviarConviteAmigo() {
    if (!emailAmigo.trim()) return
    const email = emailAmigo.trim().toLowerCase()
    if (email === user.email.toLowerCase()) {
      return toast.error('Você não pode adicionar a si mesmo como amigo')
    }
    setLoadingAmigo(true)
    try {
      await criarConvite(user.uid, email)
      toast.success('Convite enviado!')
      setEmailAmigo('')
      setShowAmigo(false)
    } catch {
      toast.error('Erro ao enviar convite')
    } finally {
      setLoadingAmigo(false)
    }
  }

  async function handleAceitarConviteAmigo(id) {
    try {
      await aceitarConvite(id, user.uid)
      toast.success('Amigo adicionado!')
    } catch {
      toast.error('Erro ao aceitar convite')
    }
  }

  const ativos = desafios.filter(d => d.status === 'ativo')
  const pendentes = desafios.filter(d => d.status === 'pendente')

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 2 }}>Bom dia,</p>
            <h1 style={{ fontSize: 24, fontWeight: 900 }}>
              {userProfile?.nome?.split(' ')[0] || 'Jogador'} 👋
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {convites.length > 0 && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Bell size={20} color="var(--accent)" />
              </motion.div>
            )}
            <Avatar src={userProfile?.foto_perfil} nome={userProfile?.nome} size={40} />
          </div>
        </div>

        {/* Streak Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.12), rgba(255,122,0,0.06))',
            border: '1px solid rgba(255,77,0,0.2)',
            marginBottom: 20,
            textAlign: 'center',
            padding: '28px 20px',
          }}
        >
          <FlameIcon streak={ativos.reduce((acc, d) => Math.max(acc, d.streak_atual_por_usuario?.[user?.uid] || 0), 0)} size={48} />
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, marginTop: 8 }}
            className="gradient-text"
          >
            {ativos.reduce((acc, d) => Math.max(acc, d.streak_atual_por_usuario?.[user?.uid] || 0), 0)}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            maior streak ativo
          </div>
        </motion.div>

        {/* Convites de amizade */}
        <AnimatePresence>
          {convites.map(c => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card"
              style={{ marginBottom: 12, border: '1px solid rgba(255,77,0,0.3)', background: 'rgba(255,77,0,0.06)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>Convite de amizade</p>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>Alguém quer ser seu amigo</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => handleAceitarConviteAmigo(c.id)}>
                  Aceitar
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Desafios pendentes */}
        {pendentes.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: 'var(--yellow)' }}>
              Aguardando aceite
            </h2>
            {pendentes.map(d => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card"
                style={{ marginBottom: 10, border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 800 }}>{d.titulo}</p>
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      Convite pendente
                    </p>
                  </div>
                  {!d.aceitos?.includes(user.uid) && (
                    <Button variant="primary" size="sm" onClick={() => handleAceitarDesafio(d.id)}>
                      Aceitar
                    </Button>
                  )}
                  {d.aceitos?.includes(user.uid) && (
                    <span style={{ fontSize: 12, color: 'var(--yellow)' }}>Aguardando...</span>
                  )}
                </div>
              </motion.div>
            ))}
          </>
        )}

        {/* Desafios ativos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Desafios Ativos</h2>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => navigate('/desafios')}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px var(--accent-glow)',
            }}
          >
            <Plus size={18} color="#fff" />
          </motion.button>
        </div>

        {ativos.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--text3)', fontSize: 14,
          }}>
            <FlameIcon streak={0} size={40} />
            <p style={{ marginTop: 12 }}>Nenhum desafio ativo</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Crie um desafio e desafie um amigo!</p>
          </div>
        )}

        {ativos.map((d, i) => (
          <DesafioCard key={d.id} desafio={d} uid={user.uid} index={i} />
        ))}

        {/* Add friend */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="card"
          style={{ marginTop: 8, marginBottom: 8, cursor: 'pointer' }}
          onClick={() => setShowAmigo(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--bg3)', border: '2px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserPlus size={18} color="var(--text3)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Adicionar amigo</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>Convide pelo e-mail</p>
            </div>
          </div>
        </motion.div>
      </div>

      <Modal open={showAmigo} onClose={() => setShowAmigo(false)} title="Adicionar amigo">
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>
          Digite o e-mail do seu amigo para enviar um convite.
        </p>
        <input
          className="input"
          type="email"
          placeholder="email@exemplo.com"
          value={emailAmigo}
          onChange={e => setEmailAmigo(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Button fullWidth onClick={handleEnviarConviteAmigo} loading={loadingAmigo}>
          Enviar convite
        </Button>
      </Modal>
    </div>
  )
}

function DesafioCard({ desafio, uid, index }) {
  const navigate = useNavigate()
  const myStreak = desafio.streak_atual_por_usuario?.[uid] || 0
  const outroUid = desafio.participantes?.find(p => p !== uid)
  const outroStreak = outroUid ? (desafio.streak_atual_por_usuario?.[outroUid] || 0) : 0
  const maxPossivel = Math.max(myStreak, outroStreak, 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      className="card"
      onClick={() => navigate(`/desafio/${desafio.id}`)}
      style={{ marginBottom: 12, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16 }}>{desafio.titulo}</h3>
        <FlameIcon streak={myStreak} size={24} animate={false} />
      </div>

      {/* Streaks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }} className="gradient-text">
            {myStreak}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Você</div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700 }}>VS</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 32, fontWeight: 900, lineHeight: 1,
            color: outroStreak > myStreak ? '#ef4444' : outroStreak === myStreak ? 'var(--text2)' : 'var(--text2)',
          }}>
            {outroStreak}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Rival</div>
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--bg3)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(myStreak / maxPossivel) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
            }}
          />
        </div>
        <div style={{ height: 6, borderRadius: 999, background: 'var(--bg3)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(outroStreak / maxPossivel) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>

      <div style={{
        marginTop: 12, padding: '8px 12px', borderRadius: 8,
        background: 'var(--bg3)',
        fontSize: 12, color: 'var(--text2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        Toque para ver detalhes e fazer check-in
      </div>
    </motion.div>
  )
}
