import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { loginGoogle, loginEmail, registerEmail, resetPassword } from '../supabase/auth'
import Button from '../components/Button'
import FlameIcon from '../components/FlameIcon'
import Modal from '../components/Modal'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleForgot(e) {
    e.preventDefault()
    if (!forgotEmail.trim()) return toast.error('Digite seu e-mail')
    setForgotLoading(true)
    try {
      await resetPassword(forgotEmail.trim())
      toast.success('Enviamos um link para redefinir sua senha')
      setShowForgot(false)
      setForgotEmail('')
    } catch (err) {
      toast.error('Não foi possível enviar o link')
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await loginGoogle()
    } catch (e) {
      toast.error('Erro ao entrar com Google')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await loginEmail(email, senha)
      } else {
        if (!nome.trim()) return toast.error('Digite seu nome')
        await registerEmail(email, senha, nome)
      }
    } catch (err) {
      const map = [
        [/invalid login credentials/i, 'E-mail ou senha incorretos'],
        [/user already registered/i, 'E-mail já cadastrado'],
        [/password should be at least/i, 'Senha muito fraca (mín. 6 caracteres)'],
        [/unable to validate email/i, 'E-mail inválido'],
      ]
      const found = map.find(([re]) => re.test(err.message || ''))
      toast.error(found ? found[1] : 'Ocorreu um erro')
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
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <FlameIcon streak={7} size={64} />
        <h1 style={{
          fontSize: 42, fontWeight: 900, letterSpacing: -1.5, marginTop: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          STRIKE
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          Desafios com quem você respeita
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                className="input"
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              className="input"
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ paddingLeft: 40 }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              className="input"
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              minLength={6}
              style={{ paddingLeft: 40 }}
            />
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        {mode === 'login' && (
          <button
            onClick={() => setShowForgot(true)}
            style={{
              width: '100%', marginTop: 12, padding: 4,
              background: 'transparent', color: 'var(--text3)',
              fontSize: 13, fontWeight: 500, textAlign: 'center',
            }}
          >
            Esqueceu a senha?
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <Button variant="secondary" fullWidth onClick={handleGoogle} loading={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </Button>

        <button
          onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
          style={{
            width: '100%', marginTop: 20, padding: 12,
            background: 'transparent', color: 'var(--text2)',
            fontSize: 14, fontWeight: 500,
          }}
        >
          {mode === 'login'
            ? 'Não tem conta? Criar agora'
            : 'Já tem conta? Entrar'}
        </button>
      </motion.div>

      <Modal open={showForgot} onClose={() => setShowForgot(false)} title="Redefinir senha">
        <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Digite seu e-mail e enviaremos um link para você criar uma nova senha.
          </p>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              className="input"
              type="email"
              placeholder="E-mail"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
              style={{ paddingLeft: 40 }}
            />
          </div>
          <Button type="submit" fullWidth loading={forgotLoading} size="lg">
            Enviar link
          </Button>
        </form>
      </Modal>
    </div>
  )
}
