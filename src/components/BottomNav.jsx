import { NavLink } from 'react-router-dom'
import { Home, Swords, Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/desafios', icon: Swords, label: 'Desafios' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/perfil', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      height: 'var(--nav-height)',
      background: 'rgba(10,10,10,0.95)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} style={{ flex: 1 }}>
          {({ isActive }) => (
            <motion.div
              whileTap={{ scale: 0.85 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 0',
              }}
            >
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: 12,
                      background: 'var(--accent-glow)',
                    }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                  />
                )}
                <Icon
                  size={22}
                  color={isActive ? 'var(--accent)' : 'var(--text3)'}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text3)',
                letterSpacing: 0.3,
              }}>
                {label}
              </span>
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
