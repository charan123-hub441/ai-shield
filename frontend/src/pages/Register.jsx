import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await API.post('/register', {
        username: form.username,
        email: form.email,
        password: form.password
      });
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '1rem', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'fixed', top: '-10%', right: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.10) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-10%', width: '400px', height: '400px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(30px)'
      }} />

      <div className="card animate-in" style={{ width: '100%', maxWidth: 440, padding: '2.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '18px',
            background: 'linear-gradient(135deg, #6c63ff, #a855f7, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 900, color: 'white', margin: '0 auto 1rem',
            boxShadow: '0 8px 25px rgba(108,99,255,0.3)',
            letterSpacing: '-0.5px'
          }}>POV</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Create account</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Join POV today
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="input" placeholder="johndoe"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" className="input" placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value.trim() })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="input" placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="input" placeholder="Repeat your password"
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
