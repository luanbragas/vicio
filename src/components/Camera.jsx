import { useRef, useEffect, useState } from 'react'
import { Camera, RefreshCcw, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from './Button'

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [error, setError] = useState(null)

  async function startCamera(mode) {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setError(null)
    } catch (e) {
      setError('Câmera não disponível. Verifique as permissões.')
    }
  }

  useEffect(() => {
    startCamera(facingMode)
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [facingMode])

  function capture() {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (blob) {
        setPreview(URL.createObjectURL(blob))
        streamRef.current?.getTracks().forEach(t => t.stop())
        onCapture(blob)
      }
    }, 'image/jpeg', 0.85)
  }

  function retake() {
    setPreview(null)
    startCamera(facingMode)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <p style={{ color: 'var(--text2)', textAlign: 'center' }}>{error}</p>
        </div>
      )}

      {!error && !preview && (
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ flex: 1, objectFit: 'cover', width: '100%' }}
        />
      )}

      {preview && (
        <img src={preview} alt="preview" style={{ flex: 1, objectFit: 'cover', width: '100%' }} />
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{
        padding: '24px 24px calc(24px + env(safe-area-inset-bottom))',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 16,
      }}>
        {!preview ? (
          <>
            <Button variant="ghost" onClick={onCancel} size="sm">Cancelar</Button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={capture}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                boxShadow: '0 0 24px var(--accent-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '4px solid rgba(255,255,255,0.2)',
              }}
            >
              <Camera size={28} color="#fff" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RefreshCcw size={18} color="#fff" />
            </motion.button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={retake} size="sm">
              <RefreshCcw size={16} /> Repetir
            </Button>
            <Button variant="success" onClick={() => {}} size="sm">
              <Check size={16} /> Usar foto
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
