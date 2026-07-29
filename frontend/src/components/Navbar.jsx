export default function Navbar({ title, subtitle }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '2rem',
      paddingBottom: '1.25rem',
      borderBottom: '1px solid var(--border)'
    }}>
      <div>
        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>
          {subtitle || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.45rem 0.95rem',
        background: 'var(--success-light)',
        borderRadius: '999px',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.08)'
      }}>
        <span className="pulse" style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--success)',
          display: 'inline-block'
        }}></span>
        <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, letterSpacing: '0.02em' }}>
          System Operational
        </span>
      </div>
    </header>
  );
}
