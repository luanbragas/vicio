import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Swords, X, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'
import {
  listenDesafiosDoUsuario,
  criarDesafio,
  aceitarDesafio,
  deletarDesafio,
  getUserByEmail,
  getUser,
} from '../supabase/db'
import Button from '../components/Button'
import Modal from '../components/Modal'
import FlameIcon from '../components/FlameIcon'
import Avatar from '../components/Avatar'

const HABITOS_SUGERIDOS = [
  '📚 Estudar', '🏋️ Treinar', '📖 Ler', '🧘 Meditar',
  '🌅 Acordar cedo', '💻 Programar', '🎸 Tocar instrumento', '✍️ Escrever',
]

export default function Desafios() {
  const { user, userProfile } = useStore()
  const navigate = useNavigate()
  const [desafios, setDesafios] = useState([])
  const [showNovo, setShowNovo] = useState(false)
  const [amigosInfo, setAmigosInfo] = useState({})
  const [desafioParaExcluir, setDesafioParaExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    if (!user) return
    return listenDesafiosDoUsuario(user.uid, setDesafios)
  }, [user])

  // Load amigos info
  useEffect(() => {
    if (!desafios.length) return
    const uids = [...new Set(
      desafios.flatMap(d => d.participantes || []).filter(uid => uid !== user?.uid)
    )]
    Promise.all(uids.map(uid => getUser(uid))).then(users => {
      const map = {}
      users.forEach(u => u && (map[u.id] = u))
      setAmigosInfo(map)
    })
  }, [desafios])

  const ativos = desafios.filter(d => d.status === 'ativo')
  const pendentes = desafios.filter(d => d.status === 'pendente')
  const encerrados = desafios.filter(d => d.status === 'encerrado')

  async function handleAceitar(id) {
    try {
      await aceitarDesafio(id, user.uid)
      toast.success('Desafio aceito!')
    } catch {
      toast.error('Erro ao aceitar desafio')
    }
  }

  async function handleExcluir() {
    if (!desafioParaExcluir) return
    setExcluindo(true)
    try {
      await deletarDesafio(desafioParaExcluir.id)
      toast.success('Desafio excluído')
      setDesafioParaExcluir(null)
    } catch {
      toast.error('Erro ao excluir desafio')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="page">
      <div style={{ padding: '56px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>Desafios</h1>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowNovo(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 999,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 12px var(--accent-glow)',
            }}
          >
            <Plus size={16} /> Novo
          </motion.button>
        </div>

        {[
          { label: 'Ativos', list: ativos, color: 'var(--green)' },
          { label: 'Aguardando aceite', list: pendentes, color: 'var(--yellow)' },
          { label: 'Encerrados', list: encerrados, color: 'var(--text3)' },
        ].map(({ label, list, color }) =>
          list.length > 0 && (
            <div key={label} style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                {label}
              </h2>
              {list.map((d, i) => {
                const rivalUids = (d.participantes || []).filter(p => p !== user?.uid)
                const rivais = rivalUids.map(uid => amigosInfo[uid]).filter(Boolean)
                const myStreak = d.streak_atual_por_usuario?.[user?.uid] || 0
                const nomesRivais = rivais.length
                  ? rivais.map(r => r.nome).join(', ')
                  : 'Rival'

                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="card"
                    style={{ marginBottom: 10, cursor: 'pointer' }}
                    onClick={() => navigate(`/desafio/${d.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', flexShrink: 0 }}>
                        {(rivais.length ? rivais : [null]).slice(0, 3).map((r, idx) => (
                          <div key={r?.id || idx} style={{ marginLeft: idx === 0 ? 0 : -14 }}>
                            <Avatar src={r?.foto_perfil} nome={r?.nome} size={44} border="var(--bg2)" />
                          </div>
                        ))}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.titulo}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          vs {nomesRivais}
                        </p>
                      </div>
                      {d.status === 'pendente' && !d.aceitos?.includes(user?.uid) ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={e => { e.stopPropagation(); handleAceitar(d.id) }}
                        >
                          Aceitar
                        </Button>
                      ) : d.status === 'pendente' ? (
                        <span style={{ fontSize: 12, color: 'var(--yellow)' }}>Aguardando...</span>
                      ) : (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: 22, fontWeight: 900 }} className="gradient-text">{myStreak}</span>
                            <FlameIcon streak={myStreak} size={18} animate={false} />
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--text3)' }}>streak</p>
                        </div>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={e => { e.stopPropagation(); setDesafioParaExcluir(d) }}
                        style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(239,68,68,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={15} color="var(--red)" />
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )
        )}

        {desafios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Swords size={48} color="var(--text3)" />
            <p style={{ color: 'var(--text2)', marginTop: 16, fontWeight: 600 }}>Nenhum desafio ainda</p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
              Crie um e desafie um amigo!
            </p>
            <div style={{ marginTop: 20 }}>
              <Button onClick={() => setShowNovo(true)}>
                <Plus size={16} /> Criar desafio
              </Button>
            </div>
          </div>
        )}
      </div>

      <NovoDesafioModal
        open={showNovo}
        onClose={() => setShowNovo(false)}
        user={user}
        userProfile={userProfile}
      />

      <Modal
        open={!!desafioParaExcluir}
        onClose={() => setDesafioParaExcluir(null)}
        title="Excluir desafio"
      >
        <div style={{ textAlign: 'center' }}>
          <Trash2 size={40} color="var(--red)" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
            Tem certeza que deseja excluir <strong>{desafioParaExcluir?.titulo}</strong>?
            Essa ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" fullWidth onClick={() => setDesafioParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={handleExcluir} loading={excluindo}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function NovoDesafioModal({ open, onClose, user, userProfile }) {
  const [titulo, setTitulo] = useState('')
  const [amigos, setAmigos] = useState([])
  const [selectedRivalIds, setSelectedRivalIds] = useState([])
  const [emailRival, setEmailRival] = useState('')
  const [emailsRival, setEmailsRival] = useState([])
  const [duracao, setDuracao] = useState(30)
  const [aposta, setAposta] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !userProfile?.amigos?.length) { setAmigos([]); return }
    const uids = userProfile.amigos.filter(uid => uid !== user.uid)
    Promise.all(uids.map(uid => getUser(uid))).then(users => {
      setAmigos(users.filter(Boolean))
    })
  }, [open, userProfile])

  function toggleRival(id) {
    setSelectedRivalIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  function adicionarEmail() {
    const email = emailRival.trim().toLowerCase()
    if (!email) return
    if (emailsRival.includes(email)) { setEmailRival(''); return }
    setEmailsRival(prev => [...prev, email])
    setEmailRival('')
  }

  function removerEmail(email) {
    setEmailsRival(prev => prev.filter(e => e !== email))
  }

  async function handleCriar() {
    if (!titulo.trim()) return toast.error('Digite o título do desafio')
    const emailPendente = emailRival.trim().toLowerCase()
    const emailsParaResolver = [...emailsRival, ...(emailPendente ? [emailPendente] : [])]
    if (!selectedRivalIds.length && !emailsParaResolver.length) {
      return toast.error('Escolha ao menos um amigo ou digite um e-mail')
    }
    setLoading(true)
    try {
      const idsPorEmail = []
      for (const email of emailsParaResolver) {
        const rival = await getUserByEmail(email)
        if (!rival) return toast.error(`Usuário não encontrado: ${email}`)
        if (rival.id === user.uid) return toast.error('Não pode desafiar a si mesmo')
        idsPorEmail.push(rival.id)
      }

      const rivalIds = [...new Set([...selectedRivalIds, ...idsPorEmail])]

      await criarDesafio({
        titulo: titulo.trim(),
        participantes: [user.uid, ...rivalIds],
        criado_por: user.uid,
        aceitos: [user.uid],
        duracao_dias: duracao === 0 ? null : duracao,
        aposta: aposta.trim() || null,
      })
      toast.success('Desafio criado! Aguardando os rivais aceitarem.')
      onClose()
      setTitulo(''); setSelectedRivalIds([]); setEmailRival(''); setEmailsRival([]); setAposta('')
    } catch (e) {
      toast.error('Erro ao criar desafio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Desafio">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>
            HÁBITO
          </label>
          <input
            className="input"
            placeholder="Ex: Estudar inglês, Treinar..."
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {HABITOS_SUGERIDOS.map(h => (
              <motion.button
                key={h}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTitulo(h)}
                style={{
                  padding: '6px 12px', borderRadius: 999, fontSize: 12,
                  background: titulo === h ? 'var(--accent)' : 'var(--bg3)',
                  color: titulo === h ? '#fff' : 'var(--text2)',
                  border: '1px solid',
                  borderColor: titulo === h ? 'var(--accent)' : 'var(--border)',
                  fontWeight: 600,
                }}
              >
                {h}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>
            RIVAIS {selectedRivalIds.length + emailsRival.length > 0 && `(${selectedRivalIds.length + emailsRival.length})`}
          </label>

          {amigos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {amigos.map(a => (
                <motion.div
                  key={a.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleRival(a.id)}
                  className="card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '10px 12px',
                    border: '1px solid',
                    borderColor: selectedRivalIds.includes(a.id) ? 'var(--accent)' : 'var(--border)',
                    background: selectedRivalIds.includes(a.id) ? 'rgba(255,77,0,0.08)' : 'var(--bg2)',
                  }}
                >
                  <Avatar src={a.foto_perfil} nome={a.nome} size={32} />
                  <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{a.nome}</span>
                  {selectedRivalIds.includes(a.id) && <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>Selecionado</span>}
                </motion.div>
              ))}
            </div>
          )}

          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
            {amigos.length > 0 ? 'Ou desafie por e-mail (pode adicionar vários):' : 'Digite o e-mail do rival (pode adicionar vários):'}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              type="email"
              placeholder="rival@email.com"
              value={emailRival}
              onChange={e => setEmailRival(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarEmail() } }}
              style={{ flex: 1 }}
            />
            <Button variant="secondary" onClick={adicionarEmail}>
              <Plus size={16} />
            </Button>
          </div>
          {emailsRival.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {emailsRival.map(email => (
                <span
                  key={email}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 999, fontSize: 12,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--text2)', fontWeight: 600,
                  }}
                >
                  {email}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => removerEmail(email)} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>
            DURAÇÃO
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 14, 30, 60, 0].map(d => (
              <motion.button
                key={d}
                whileTap={{ scale: 0.9 }}
                onClick={() => setDuracao(d)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: duracao === d ? 'var(--accent)' : 'var(--bg3)',
                  color: duracao === d ? '#fff' : 'var(--text2)',
                  border: '1px solid',
                  borderColor: duracao === d ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {d === 0 ? '∞' : `${d}d`}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>
            APOSTA (opcional)
          </label>
          <input
            className="input"
            placeholder="Ex: Quem perder paga o café"
            value={aposta}
            onChange={e => setAposta(e.target.value)}
          />
        </div>

        <Button fullWidth onClick={handleCriar} loading={loading} size="lg">
          <Swords size={16} /> Criar Desafio
        </Button>
      </div>
    </Modal>
  )
}
