import { useEffect, useState } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  pending:  { color: '#ffbe0b', bg: 'rgba(255,190,11,0.12)' },
  reviewed: { color: '#4cc9f0', bg: 'rgba(76,201,240,0.12)' },
  resolved: { color: '#06d6a0', bg: 'rgba(6,214,160,0.12)' },
};

const INCIDENT_TYPES = ['cyberbullying', 'hate speech', 'harassment', 'threats', 'impersonation', 'other'];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ description: '', incident_type: 'cyberbullying' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const loadReports = () => {
    setLoading(true);
    API.get('/reports').then(r => setReports(r.data)).finally(() => setLoading(false));
  };

  useEffect(loadReports, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/reports', form);
      setMessage('✅ Report submitted successfully!');
      setForm({ description: '', incident_type: 'cyberbullying' });
      setShowForm(false);
      loadReports();
      setTimeout(() => setMessage(''), 4000);
    } catch {
      setMessage('❌ Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/reports/${id}/status?status=${status}`);
      loadReports();
    } catch {
      setMessage('❌ Failed to update status.');
    }
  };

  return (
    <div style={{ flex: 1 }} className="animate-in">
      <Navbar title="Reports" />

      {message && <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

      {/* Submit form toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '＋ Submit Report'}
        </button>
      </div>

      {showForm && (
        <div className="card animate-in" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            📋 Report an Incident
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Incident Type</label>
              <select className="input" value={form.incident_type} onChange={e => setForm({ ...form, incident_type: e.target.value })}>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" placeholder="Describe the incident in detail…" style={{ minHeight: 120 }}
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ marginRight: 8 }} />Submitting…</> : 'Submit Report'}
            </button>
          </form>
        </div>
      )}

      {/* Reports list */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>📋 Incident Reports</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {reports.length} report{reports.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-ghost" onClick={loadReports}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
            <p style={{ fontWeight: 500 }}>No reports yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {reports.map(r => {
              const s = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
              return (
                <div key={r.id} style={{
                  padding: '1rem 1.25rem', border: '1px solid var(--border)', borderRadius: '12px',
                  background: 'var(--bg-secondary)', display: 'flex', gap: '1rem', alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>
                        {r.incident_type}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        #{r.id} · {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{r.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: 100 }}>
                    <span style={{
                      display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: '999px',
                      fontSize: '0.72rem', fontWeight: 600, color: s.color, background: s.bg, textTransform: 'capitalize'
                    }}>
                      {r.status}
                    </span>
                    {user?.role === 'admin' && (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {['reviewed', 'resolved'].filter(st => st !== r.status).map(st => (
                          <button key={st} className="btn-ghost" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', textTransform: 'capitalize' }}
                            onClick={() => updateStatus(r.id, st)}>
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
