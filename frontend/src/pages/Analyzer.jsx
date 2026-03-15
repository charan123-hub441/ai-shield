import { useState } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const LABEL_CONFIG = {
  'Safe':              { cls: 'label-safe',        icon: '✅', desc: 'No harmful content detected.' },
  'Offensive':         { cls: 'label-offensive',   icon: '⚠️', desc: 'Mildly offensive language detected.' },
  'Cyberbullying':     { cls: 'label-cyberbullying', icon: '🚨', desc: 'Cyberbullying patterns detected. Auto-flagged.' },
  'Severe Harassment': { cls: 'label-severe',       icon: '☠️', desc: 'Severe harassment detected. Immediate action recommended.' },
};

function ProgressBar({ value, color }) {
  return (
    <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
      <div className="progress-fill" style={{ width: `${value * 100}%`, background: color }} />
    </div>
  );
}

export default function Analyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!text.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await API.post('/analyze', { content: text });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? LABEL_CONFIG[result.label] : null;

  const scoreColor = result
    ? result.score < 0.2 ? '#06d6a0'
    : result.score < 0.45 ? '#ffbe0b'
    : result.score < 0.75 ? '#ff4d6d'
    : '#ff006e'
    : '#6c63ff';

  return (
    <div style={{ flex: 1 }} className="animate-in">
      <Navbar title="Message Analyzer" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Input panel */}
        <div className="card">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            🔍 Analyze Message
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Paste social media text below. The AI will classify its toxicity level instantly.
          </p>
          <div className="form-group">
            <label className="form-label">Message Content</label>
            <textarea
              className="input"
              style={{ minHeight: 180, fontSize: '0.9rem', lineHeight: 1.6 }}
              placeholder="Paste or type a message here to analyze…"
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {text.length} characters
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-ghost" onClick={() => { setText(''); setResult(null); }}>Clear</button>
              <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
                {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Analyzing…</> : '⚡ Analyze'}
              </button>
            </div>
          </div>
          {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
        </div>

        {/* Result panel */}
        <div className="card" style={{ minHeight: 300 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            📊 AI Analysis Result
          </h2>

          {!result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: '1rem' }}>
              <div style={{ fontSize: '3.5rem' }}>🤖</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
                Waiting for message input.<br />Results will appear here.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: '1rem' }}>
              <div className="spinner pulse" style={{ width: 44, height: 44, borderWidth: 3 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Running AI pipeline…</p>
            </div>
          )}

          {result && cfg && (
            <div className="animate-in">
              {/* Label badge */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`label-badge ${cfg.cls}`} style={{ fontSize: '1rem', padding: '0.4rem 1rem' }}>
                  {cfg.icon} {result.label}
                </span>
                {result.is_flagged && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,77,109,0.15)', color: 'var(--danger)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontWeight: 600 }}>
                    🚩 Auto-Flagged
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                {cfg.desc}
              </p>

              {/* Scores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Toxicity Score</span>
                    <span style={{ fontWeight: 700, color: scoreColor }}>{(result.score * 100).toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={result.score} color={scoreColor} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Model Confidence</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={result.confidence} color="var(--accent)" />
                </div>
              </div>

              {/* Message ID */}
              <div style={{ marginTop: '1.5rem', padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                📨 Message saved with ID <strong style={{ color: 'var(--text-primary)' }}>#{result.message_id}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
        {Object.entries(LABEL_CONFIG).map(([label, cfg]) => (
          <div key={label} className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{cfg.icon}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{cfg.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
