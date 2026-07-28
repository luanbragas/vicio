import { motion } from 'framer-motion'
import FlameIcon from './FlameIcon'

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      >
        <FlameIcon streak={7} size={56} />
      </motion.div>
      <span style={{ color: 'var(--text3)', fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>
        STRIKE
      </span>
    </div>
  )
}
