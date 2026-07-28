import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2, XCircle, Clock, Camera, Snowflake, AlertTriangle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store/useStore'
import {
  listenDesafio,
  listenCheckins,
  getUser,
  avaliarCheckin,
  usarStreakFreeze,
  aceitarDesafio,
  criarCheckin,
  deletarDesafio,
} from '../supabase/db'
import { uploadCheckinFoto, getAuthDebugInfo } from '../supabase/storage'
import FlameIcon from '../components/FlameIcon'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Modal from '../components/Modal'
import CameraCapture from '../components/Camera'
import Timer from '../components/Timer'

function describeError(label, e) {
  const fields = {}
  for (const k of ['name', 'message', 'status', 'statusCode', 'code', 'error', 'details', 'hint']) {
    if (e?.[k] !== undefined) fields[k] = e[k]
  }
  return `${label}\n${JSON.stringify(fields, null, 2)}`
}

export default function DesafioDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useStore()
  const [desafio, setDesafio] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [outrosInfo, setOutrosInfo] = useState({})
  const [showCheckin, setShowCheckin] = useState(false)
  const [showAprovar, setShowAprovar] = useState(null)
  const [checkinStep, setCheckinStep] = useState('timer') // 'timer' | 'camera'
  const [timerData, setTimerData] = useState(null)
  const [fotoBlob, setFotoBlob] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [motivoReprovacao, setMotivoReprovacao] = useState('')
  const [showFreeze, setShowFreeze] = useState(false)
  const [errorDetail, setErrorDetail] = useState(null)
  const [showExcluir, setShowExcluir] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    const unsub1 = listenDesafio(id, setDesafio)
    const unsub2 = listenCheckins(id, setCheckins)
    return () => { unsub1(); unsub2() }
  }, [id])

  useEffect(() => {
    if (!desafio || !user) return
    const outrosUids = (desafio.participantes || []).filter(p => p !== user.uid)
    Promise.all(outrosUids.map(uid => getUser(uid))).then(users => {
      const map = {}
      users.forEach(u => u && (map[u.id] = u))
      setOutrosInfo(map)
    })
  }, [desafio, user])

  const myStreak = desafio?.streak_atual_por_usuario?.[user?.uid] || 0
  const rankingParticipantes = (desafio?.participantes || []).map(uid => {
    const isMe = uid === user?.uid
    const info = outrosInfo[uid]
    return {
      uid,
      isMe,
      nome: isMe ? 'Você' : (info?.nome || 'Rival'),
      foto: info?.foto_perfil,
      streak: desafio?.streak_atual_por_usuario?.[uid] || 0,
    }
  }).sort((a, b) => b.streak - a.streak)

  const pendentesParaMim = checkins.filter(
    c => c.userId !== user?.uid && c.status === 'pendente'
  )

  const fezCheckinHoje = checkins.some(c => {
    if (c.userId !== user?.uid) return false
    if (!c.criado_em) return false
    const data = new Date(c.criado_em)
    const hoje = new Date()
    return data.toDateString() === hoje.toDateString()
  })

  async function handleEnviarCheckin() {
    if (!timerData || !fotoBlob) return toast.error('Complete o cronômetro e a foto')
    setUploading(true)
    let fotoUrl
    try {
      const checkinId = `${user.uid}_${Date.now()}`
      try {
        fotoUrl = await uploadCheckinFoto(id, checkinId, fotoBlob)
      } catch (e) {
        console.error('Erro no upload da foto:', e)
        const auth = await getAuthDebugInfo()
        setErrorDetail(`${describeError('Upload da foto', e)}\n\nSessão:\n${JSON.stringify(auth, null, 2)}`)
        throw new Error(`Upload da foto: ${e.message || e.error_description || 'desconhecido'}`)
      }
      try {
        await criarCheckin(id, {
          userId: user.uid,
          foto_url: fotoUrl,
          horario_inicio: timerData.horario_inicio,
          horario_fim: timerData.horario_fim,
          duracao_minutos: timerData.duracao_minutos,
        })
      } catch (e) {
        console.error('Erro ao salvar check-in:', e)
        const auth = await getAuthDebugInfo()
        setErrorDetail(`${describeError('Salvar check-in', e)}\n\nSessão:\n${JSON.stringify(auth, null, 2)}`)
        throw new Error(`Salvar check-in: ${e.message || e.error_description || 'desconhecido'}`)
      }
      toast.success('Check-in enviado! Aguardando aprovação.')
      setShowCheckin(false)
      setTimerData(null)
      setFotoBlob(null)
      setCheckinStep('timer')
    } catch (e) {
      toast.error(e.message || 'Erro ao enviar check-in')
    } finally {
      setUploading(false)
    }
  }

  async function handleAprovar(checkinId, aprovado) {
    if (!aprovado && !motivoReprovacao.trim()) {
      return toast.error('Informe o motivo da reprovação')
    }
    try {
      await avaliarCheckin(id, checkinId, user.uid, aprovado, motivoReprovacao)
      toast.success(aprovado ? 'Check-in aprovado! 🔥' : 'Check-in reprovado')
      setShowAprovar(null)
      setMotivoReprovacao('')
    } catch {
      toast.error('Erro ao avaliar')
    }
  }

  async function handleAceitarDesafio() {
    try {
      await aceitarDesafio(id, user.uid)
      toast.success('Desafio aceito!')
    } catch {
      toast.error('Erro ao aceitar desafio')
    }
  }

  async function handleFreeze() {
    try {
      await usarStreakFreeze(id, user.uid)
      toast.success('Streak Freeze usado! Seu streak está protegido hoje.')
      setShowFreeze(false)
    } catch (e) {
      toast.error(e.message || 'Erro ao usar freeze')
    }
  }

  async function handleExcluir() {
    setExcluindo(true)
    try {
      await deletarDesafio(id)
      toast.success('Desafio excluído')
      navigate('/desafios')
    } catch {
      toast.error('Erro ao excluir desafio')
      setExcluindo(false)
    }
  }

  if (!desafio) return null

  return (
    <div className="page">
      <div style={{ padding: '0 0 20px' }}>
        {/* Header */}
        <div style={{
          padding: '56px 20px 20px',
          background: 'linear-gradient(180deg, rgba(255,77,0,0.1) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate(-1)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} />
            </motion.button>
            <h1 style={{ fontSize: 20, fontWeight: 900, flex: 1 }}>{desafio.titulo}</h1>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setShowExcluir(true)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Trash2 size={16} color="var(--red)" />
            </motion.button>
          </div>

          {/* Ranking dos participantes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rankingParticipantes.map((p, i) => (
              <div
                key={p.uid}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 12,
                  background: p.isMe ? 'rgba(255,77,0,0.08)' : 'var(--bg2)',
                  border: '1px solid',
                  borderColor: p.isMe ? 'rgba(255,77,0,0.2)' : 'var(--border)',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, width: 16, textAlign: 'center' }}>
                  {i + 1}º
                </span>
                <Avatar src={p.foto} nome={p.isMe ? undefined : p.nome} size={32} />
                <span style={{ fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.nome}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900 }} className={p.isMe ? 'gradient-text' : ''}>
                  {p.streak}
                </span>
                <FlameIcon streak={p.streak} size={18} animate={false} />
              </div>
            ))}
          </div>

          {desafio.aposta && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
              fontSize: 13, color: 'var(--yellow)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertTriangle size={14} />
              Aposta: {desafio.aposta}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 10 }}>
          {desafio.status === 'pendente' && !desafio.aceitos?.includes(user?.uid) && (
            <Button fullWidth onClick={handleAceitarDesafio} size="lg">
              <CheckCircle2 size={18} /> Aceitar Desafio
            </Button>
          )}
          {desafio.status === 'pendente' && desafio.aceitos?.includes(user?.uid) && (
            <div style={{
              flex: 1, padding: '16px', borderRadius: 12,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
              textAlign: 'center', color: 'var(--yellow)', fontWeight: 700, fontSize: 14,
            }}>
              <Clock size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Aguardando os demais aceitarem...
            </div>
          )}
          {!fezCheckinHoje && desafio.status === 'ativo' && (
            <Button
              fullWidth
              onClick={() => setShowCheckin(true)}
              size="lg"
            >
              <Camera size={18} /> Check-in
            </Button>
          )}
          {fezCheckinHoje && (
            <div style={{
              flex: 1, padding: '16px', borderRadius: 12,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              textAlign: 'center', color: 'var(--green)', fontWeight: 700, fontSize: 14,
            }}>
              <CheckCircle2 size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Check-in de hoje enviado!
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowFreeze(true)}
            style={{
              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Snowflake size={20} color="#60a5fa" />
          </motion.button>
        </div>

        {/* Pendentes para aprovar */}
        {pendentesParaMim.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Aguardando sua aprovação
            </h3>
            {pendentesParaMim.map(c => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ marginBottom: 8, border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  {outrosInfo[c.userId]?.nome || 'Rival'}
                </p>
                {c.foto_url && (
                  <img
                    src={c.foto_url}
                    alt="check-in"
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>Duração</p>
                    <p style={{ fontWeight: 700 }}>{c.duracao_minutos} min</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>Status</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="var(--yellow)" />
                      <p style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 600 }}>Pendente</p>
                    </div>
                  </div>
                </div>
                <Button fullWidth variant="success" size="sm" onClick={() => setShowAprovar(c)}>
                  Avaliar prova
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Histórico */}
        <div style={{ padding: '0 20px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
            Histórico
          </h3>
          {checkins.length === 0 && (
            <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              Nenhum check-in ainda
            </p>
          )}
          {checkins.map((c, i) => (
            <CheckinItem key={c.id} checkin={c} uid={user?.uid} outrosInfo={outrosInfo} index={i} />
          ))}
        </div>
      </div>

      {/* Modal Check-in */}
      <Modal
        open={showCheckin}
        onClose={() => { setShowCheckin(false); setCheckinStep('timer'); setTimerData(null); setFotoBlob(null) }}
        title={checkinStep === 'timer' ? 'Cronômetro' : 'Foto'}
        fullscreen
      >
        {checkinStep === 'timer' && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 32 }}>
              Inicie o cronômetro quando começar a atividade e pare quando terminar.
            </p>
            <Timer onComplete={(data) => {
              setTimerData(data)
              setCheckinStep('camera')
            }} />
          </div>
        )}

        {checkinStep === 'camera' && !fotoBlob && (
          <CameraCapture
            onCapture={(blob) => setFotoBlob(blob)}
            onCancel={() => setCheckinStep('timer')}
          />
        )}

        {checkinStep === 'camera' && fotoBlob && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={URL.createObjectURL(fotoBlob)}
              alt="preview"
              style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 300, objectFit: 'cover' }}
            />
            <p style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>
              Foto capturada! Duração: {timerData?.duracao_minutos} min
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" fullWidth onClick={() => setFotoBlob(null)}>Repetir foto</Button>
              <Button fullWidth onClick={handleEnviarCheckin} loading={uploading}>Enviar check-in</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Aprovação */}
      <Modal
        open={!!showAprovar}
        onClose={() => { setShowAprovar(null); setMotivoReprovacao('') }}
        title="Avaliar check-in"
      >
        {showAprovar && (
          <div>
            {showAprovar.foto_url && (
              <img
                src={showAprovar.foto_url}
                alt="prova"
                style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 320, objectFit: 'cover' }}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>DURAÇÃO</p>
                <p style={{ fontSize: 24, fontWeight: 900 }}>{showAprovar.duracao_minutos}<span style={{ fontSize: 13, color: 'var(--text3)' }}>min</span></p>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--text3)' }}>STATUS</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--yellow)', marginTop: 6 }}>Pendente</p>
              </div>
            </div>
            <textarea
              className="input"
              placeholder="Motivo da reprovação (obrigatório se reprovar)"
              value={motivoReprovacao}
              onChange={e => setMotivoReprovacao(e.target.value)}
              rows={3}
              style={{ resize: 'none', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="danger" fullWidth onClick={() => handleAprovar(showAprovar.id, false)}>
                <XCircle size={16} /> Reprovar
              </Button>
              <Button variant="success" fullWidth onClick={() => handleAprovar(showAprovar.id, true)}>
                <CheckCircle2 size={16} /> Aprovar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Freeze */}
      <Modal open={showFreeze} onClose={() => setShowFreeze(false)} title="Streak Freeze">
        <div style={{ textAlign: 'center' }}>
          <Snowflake size={48} color="#60a5fa" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
            Use um <strong>Streak Freeze</strong> para proteger seu streak hoje sem precisar fazer check-in.
            Você tem direito a <strong>1 por semana</strong>.
          </p>
          <Button fullWidth onClick={handleFreeze} style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', boxShadow: '0 4px 16px rgba(96,165,250,0.3)' }}>
            <Snowflake size={16} /> Usar Freeze
          </Button>
        </div>
      </Modal>

      {/* Modal Excluir */}
      <Modal open={showExcluir} onClose={() => setShowExcluir(false)} title="Excluir desafio">
        <div style={{ textAlign: 'center' }}>
          <Trash2 size={40} color="var(--red)" style={{ marginBottom: 16 }} />
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
            Tem certeza que deseja excluir <strong>{desafio.titulo}</strong>?
            Essa ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" fullWidth onClick={() => setShowExcluir(false)}>
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={handleExcluir} loading={excluindo}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhe do Erro */}
      <Modal open={!!errorDetail} onClose={() => setErrorDetail(null)} title="Detalhe do erro">
        <pre style={{
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          fontSize: 12, background: 'var(--bg3)', padding: 12, borderRadius: 8,
          maxHeight: '50vh', overflowY: 'auto',
        }}>{errorDetail}</pre>
        <Button
          fullWidth
          variant="secondary"
          style={{ marginTop: 12 }}
          onClick={() => {
            navigator.clipboard?.writeText(errorDetail).then(
              () => toast.success('Copiado!'),
              () => toast.error('Não foi possível copiar')
            )
          }}
        >
          Copiar
        </Button>
      </Modal>
    </div>
  )
}

function CheckinItem({ checkin, uid, outrosInfo, index }) {
  const isMine = checkin.userId === uid
  const autor = outrosInfo?.[checkin.userId]
  const STATUS_COLOR = { aprovado: 'var(--green)', reprovado: 'var(--red)', pendente: 'var(--yellow)' }
  const STATUS_ICON = {
    aprovado: <CheckCircle2 size={14} color="var(--green)" />,
    reprovado: <XCircle size={14} color="var(--red)" />,
    pendente: <Clock size={14} color="var(--yellow)" />,
  }

  const dataStr = checkin.criado_em
    ? new Date(checkin.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="card"
      style={{ marginBottom: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: checkin.foto_url ? 10 : 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isMine ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--bg3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {isMine ? 'V' : (autor?.nome?.charAt(0) || 'R')}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>{isMine ? 'Você' : (autor?.nome || 'Rival')}</p>
          <p style={{ fontSize: 11, color: 'var(--text3)' }}>{dataStr} · {checkin.duracao_minutos}min</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {STATUS_ICON[checkin.status]}
          <span style={{ fontSize: 11, color: STATUS_COLOR[checkin.status], fontWeight: 600 }}>
            {checkin.status}
          </span>
        </div>
      </div>
      {checkin.foto_url && (
        <img
          src={checkin.foto_url}
          alt="check-in"
          style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }}
        />
      )}
      {checkin.motivo_reprovacao && (
        <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, padding: '6px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>
          {checkin.motivo_reprovacao}
        </p>
      )}
    </motion.div>
  )
}
