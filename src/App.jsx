import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import LoadingScreen from './components/LoadingScreen'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Home from './pages/Home'
import Desafios from './pages/Desafios'
import DesafioDetail from './pages/DesafioDetail'
import Ranking from './pages/Ranking'
import Perfil from './pages/Perfil'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants} initial="initial" animate="animate" exit="exit"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const { user } = useAuth()

  if (user === undefined) return <LoadingScreen />

  if (!user) {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <Login />
      </>
    )
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/"            element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/desafios"    element={<PageWrapper><Desafios /></PageWrapper>} />
        <Route path="/desafio/:id" element={<PageWrapper><DesafioDetail /></PageWrapper>} />
        <Route path="/ranking"     element={<PageWrapper><Ranking /></PageWrapper>} />
        <Route path="/perfil"      element={<PageWrapper><Perfil /></PageWrapper>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
