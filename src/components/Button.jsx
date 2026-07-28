import { motion } from 'framer-motion'

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  type = 'button',
  style: extraStyle,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    fontWeight: 700,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'opacity 0.2s',
    ...extraStyle,
  }

  const sizes = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '14px 24px', fontSize: 15 },
    lg: { padding: '18px 32px', fontSize: 17 },
  }

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
      color: '#fff',
      boxShadow: '0 4px 24px var(--accent-glow)',
    },
    secondary: {
      background: 'var(--bg3)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text2)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff',
      boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
    },
    success: {
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      color: '#fff',
      boxShadow: '0 4px 16px rgba(34,197,94,0.3)',
    },
  }

  return (
    <motion.button
      type={type}
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      onClick={!disabled && !loading ? onClick : undefined}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
    >
      {loading ? (
        <span style={{
          width: 16, height: 16,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.6s linear infinite',
        }} />
      ) : children}
    </motion.button>
  )
}
