import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/feed',      label: 'Feed',      icon: '📱' },
  { path: '/reels',     label: 'Reels',     icon: '🎬' },
  { path: '/search',    label: 'Search',    icon: '🔍' },
  { path: '/analyzer',  label: 'Analyzer',  icon: '🛡️' },
  { path: '/chat',      label: 'Chat',      icon: '💬' },
  { path: '/call',      label: 'Call',       icon: '📞' },
  { path: '/profile',   label: 'Profile',   icon: '👤' },
  { path: '/requests',  label: 'Requests',  icon: '📥' },
  { path: '/moderation',label: 'Moderation',icon: '⚖️' },
  { path: '/reports',   label: 'Reports',   icon: '📋' },
  { path: '/settings',  label: 'Settings',  icon: '⚙️' },
];

export default function Sidebar({ theme, toggleTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchRequests = async () => {
        try {
          const res = await API.get('/users/me/follow-requests');
          setRequestCount(res.data.length);
        } catch (err) {
          console.error("Failed to fetch follow requests", err);
        }
      };
      
      fetchRequests();
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ marginBottom: '2.2rem', paddingLeft: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: '12px',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 900, color: '#ffffff',
            boxShadow: 'var(--glow)',
            letterSpacing: '-0.5px'
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                POV
              </span>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent)',
                padding: '0.15rem 0.4rem', borderRadius: '6px',
                background: 'var(--accent-light)', border: '1px solid rgba(99,102,241,0.2)'
              }}>ENTERPRISE</span>
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em', marginTop: '1px' }}>
              Social Protection Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ position: 'relative' }}
          >
            <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.path === '/requests' && requestCount > 0 && (
              <span style={{
                background: 'var(--danger)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
              }}>
                {requestCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        {/* Theme toggle */}
        <button className="nav-item" onClick={toggleTheme} style={{ justifyContent: 'flex-start' }}>
          <span style={{ fontSize: '1.1rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User Card */}
        <div style={{
          padding: '0.75rem 0.85rem',
          background: 'var(--accent-light)',
          borderRadius: '12px',
          border: '1px solid rgba(99,102,241,0.18)',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 800, color: '#ffffff', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.username}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>
              {user?.role || 'User'}
            </p>
          </div>
        </div>

        <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🚪</span>
          <span style={{ fontWeight: 600 }}>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
