import { useEffect, useState } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const ACTION_OPTIONS = ['warned', 'deleted', 'blocked', 'pending'];

const actionStyle = {
  warned:  { color: '#ffbe0b', bg: 'rgba(255,190,11,0.12)' },
  deleted: { color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)' },
  blocked: { color: '#ff006e', bg: 'rgba(255,0,110,0.12)' },
  pending: { color: '#8b90a7', bg: 'rgba(139,144,167,0.12)' },
};

export default function Moderation() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const load = () => {
    setLoading(true);
    API.get('/moderation/flagged').then(r => setFlagged(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const applyAction = async (id, action) => {
    try {
      await API.post('/moderation/action', { flagged_message_id: id, action });
      setActionMsg(`✅ Action '${action}' applied.`);
      load();
      setTimeout(() => setActionMsg(''), 3000);
    } catch {
      setActionMsg('❌ Failed to apply action.');
    }
  };

  return (
    <div style={{ flex: 1 }} className="animate-in">
      <Navbar title="Moderation Panel" />

      {actionMsg && <div className="alert alert-success">{actionMsg}</div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>🚩 Flagged Messages</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {flagged.length} message{flagged.length !== 1 ? 's' : ''} flagged by AI
            </p>
          </div>
          <button className="btn-ghost" onClick={load}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
        ) : flagged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✨</div>
            <p style={{ fontWeight: 500 }}>No flagged messages!</p>
            <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>All content appears safe.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Message</th>
                  <th>Label</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map(f => {
                  const s = actionStyle[f.action] || actionStyle.pending;
                  return (
                    <tr key={f.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>#{f.id}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {f.username}
                        </span>
                      </td>
                      <td style={{ maxWidth: 260 }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.content}
                        </p>
                      </td>
                      <td>
                        <span className={`label-badge label-${f.label.toLowerCase().replace(' ', '')}`}>
                          {f.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: f.score > 0.7 ? '#ff006e' : f.score > 0.4 ? '#ff4d6d' : '#ffbe0b' }}>
                        {(f.score * 100).toFixed(0)}%
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.65rem',
                          borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                          color: s.color, background: s.bg, textTransform: 'capitalize'
                        }}>
                          {f.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {ACTION_OPTIONS.filter(a => a !== f.action).map(a => (
                            <button key={a} className="btn-ghost" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', textTransform: 'capitalize' }}
                              onClick={() => applyAction(f.id, a)}>
                              {a}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
