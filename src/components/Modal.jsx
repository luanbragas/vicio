import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, fullscreen }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: fullscreen ? '100%' : 60, scale: fullscreen ? 1 : 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: fullscreen ? '100%' : 60, scale: fullscreen ? 1 : 0.95 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            style={{
              position: 'fixed',
              zIndex: 201,
              ...(fullscreen
                ? { inset: 0, borderRadius: 0, display: 'flex', flexDirection: 'column' }
                : {
                  bottom: 0, left: 0, right: 0, margin: '0 auto',
                  width: '100%', maxWidth: 480,
                  borderRadius: '24px 24px 0 0',
                  maxHeight: '92dvh',
                  display: 'flex', flexDirection: 'column',
                }),
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
            }}
          >
            {title && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 20px 12px',
                flexShrink: 0,
                borderBottom: '1px solid var(--border)',
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h2>
                {onClose && (
                  <button
                    onClick={onClose}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--bg3)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text2)',
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div style={{
              padding: 20,
              overflowY: 'auto',
              flex: 1,
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
            }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
