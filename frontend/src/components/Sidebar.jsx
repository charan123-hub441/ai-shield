import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/feed',      label: 'Feed',      icon: '📱' },
  { path: '/analyzer',  label: 'Analyzer',  icon: '🔍' },
  { path: '/chat',      label: 'Chat',      icon: '💬' },
  { path: '/call',      label: 'Call',       icon: '📞' },
  { path: '/profile',    label: 'Profile',   icon: '👤' },
  { path: '/moderation', label: 'Moderation', icon: '🛡️' },
  { path: '/reports',   label: 'Reports',   icon: '📋' },
];

export default function Sidebar({ theme, toggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.3rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, #6c63ff, #a855f7, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 900, color: 'white',
            boxShadow: '0 4px 15px rgba(108,99,255,0.35)',
            letterSpacing: '-0.5px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 900 }}>P</span>
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              POV
            </span>
            <span style={{
              fontSize: '0.6rem', fontWeight: 600, color: 'var(--accent)',
              marginLeft: '0.4rem', padding: '0.1rem 0.35rem', borderRadius: '4px',
              background: 'rgba(108,99,255,0.12)', verticalAlign: 'super'
            }}>PRO</span>
          </div>
        </div>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', paddingLeft: '0.15rem', letterSpacing: '0.3px' }}>
          Social Media Protection
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
        {/* Theme toggle */}
        <button className="nav-item" onClick={toggleTheme}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User info */}
        <div style={{
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(168,85,247,0.06))',
          borderRadius: '12px',
          border: '1px solid rgba(108,99,255,0.12)',
          display: 'flex', alignItems: 'center', gap: '0.6rem'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {user?.username}
            </p>
            <p style={{ fontSize: '0.68rem', color: 'var(--accent)', textTransform: 'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </div>

        <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
