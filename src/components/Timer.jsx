import { useState, useEffect, useRef } from 'react'
import { Play, Square } from 'lucide-react'
import { motion } from 'framer-motion'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function Timer({ onComplete }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function start() {
    setStartTime(new Date().toISOString())
    setRunning(true)
  }

  function stop() {
    setRunning(false)
    onComplete?.({
      horario_inicio: startTime,
      horario_fim: new Date().toISOString(),
      duracao_minutos: Math.round(elapsed / 60),
    })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        animate={running ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        style={{
          fontSize: 56,
          fontWeight: 900,
          letterSpacing: -2,
          fontVariantNumeric: 'tabular-nums',
          background: running
            ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
            : 'var(--text3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 24,
        }}
      >
        {formatTime(elapsed)}
      </motion.div>

      {!running ? (
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={start}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 32px', borderRadius: 999,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: '#fff', fontWeight: 800, fontSize: 16,
            boxShadow: '0 4px 24px var(--accent-glow)',
          }}
        >
          <Play size={18} fill="#fff" /> Iniciar
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={stop}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 32px', borderRadius: 999,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', fontWeight: 800, fontSize: 16,
            boxShadow: '0 4px 24px rgba(239,68,68,0.3)',
          }}
        >
          <Square size={18} fill="#fff" /> Parar
        </motion.button>
      )}
    </div>
  )
}
