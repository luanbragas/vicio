import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { updatePassword } from '../supabase/auth'
import { useStore } from '../store/useStore'
import Button from '../components/Button'
import FlameIcon from '../components/FlameIcon'

export default function ResetPassword() {
  const setPasswordRecovery = useStore(s => s.setPasswordRecovery)
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (senha !== confirmar) return toast.error('As senhas não coincidem')
    setLoading(true)
    try {
      await updatePassword(senha)
      toast.success('Senha atualizada com sucesso')
      setPasswordRecovery(false)
    } catch (err) {
      toast.error('Não foi possível atualizar a senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <FlameIcon streak={7} size={64} />
        <h1 style={{
          fontSize: 28, fontWeight: 900, letterSpacing: -1, marginTop: 8,
        }}>
          Nova senha
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          Crie uma nova senha para sua conta
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              className="input"
              type="password"
              placeholder="Nova senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              minLength={6}
              style={{ paddingLeft: 40 }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              className="input"
              type="password"
              placeholder="Confirmar senha"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
              minLength={6}
              style={{ paddingLeft: 40 }}
            />
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            Salvar nova senha
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
