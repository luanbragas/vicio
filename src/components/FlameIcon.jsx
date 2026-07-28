import { motion } from 'framer-motion'

const LEVELS = [
  { min: 0, color: '#555', label: 'apagada' },
  { min: 1, color: '#ff4d00', label: 'pequena' },
  { min: 7, color: '#ff7a00', label: 'grande' },
  { min: 21, color: '#60a5fa', label: 'azul' },
  { min: 50, color: '#fbbf24', label: 'dourada' },
]

function getLevel(streak) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (streak >= l.min) level = l
  }
  return level
}

export default function FlameIcon({ streak = 0, size = 32, animate = true }) {
  const level = getLevel(streak)
  const isActive = streak > 0

  return (
    <motion.div
      animate={isActive && animate ? {
        scale: [1, 1.08, 1],
        filter: [`drop-shadow(0 0 0px ${level.color})`, `drop-shadow(0 0 8px ${level.color})`, `drop-shadow(0 0 0px ${level.color})`],
      } : {}}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C12 2 7 8 7 13a5 5 0 0010 0c0-5-5-11-5-11z"
          fill={level.color}
          opacity={isActive ? 1 : 0.25}
        />
        <path
          d="M12 10c0 0-2 3-2 5a2 2 0 004 0c0-2-2-5-2-5z"
          fill={isActive ? 'rgba(255,255,255,0.35)' : 'transparent'}
        />
      </svg>
    </motion.div>
  )
}
