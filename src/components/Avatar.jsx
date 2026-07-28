export default function Avatar({ src, nome, size = 40, border }) {
  const initials = (nome || '?').charAt(0).toUpperCase()

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 700,
      color: '#fff',
      flexShrink: 0,
      border: border ? `2px solid ${border}` : 'none',
    }}>
      {src
        ? <img src={src} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}
