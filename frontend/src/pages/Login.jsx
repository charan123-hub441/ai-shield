import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/login', form);
      login(data.access_token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '1rem', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '-15%', left: '-8%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.10) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', right: '-8%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(40px)'
      }} />

      <div className="card animate-in" style={{ width: '100%', maxWidth: 420, padding: '2.5rem', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '18px',
            background: 'linear-gradient(135deg, #6c63ff, #a855f7, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 900, color: 'white', margin: '0 auto 1rem',
            boxShadow: '0 8px 25px rgba(108,99,255,0.3)',
            letterSpacing: '-0.5px'
          }}>POV</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Welcome back</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Sign in with your email and password
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value.trim() })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
