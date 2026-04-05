import { useState, useEffect } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="animate-in" style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <Navbar title="Settings" />

      <div className="card" style={{ display: 'flex', minHeight: '600px', padding: 0, overflow: 'hidden' }}>
        {/* Sidebar for settings */}
        <div style={{
          width: '240px',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '1.5rem 0'
        }}>
          <h2 style={{ padding: '0 1.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Settings</h2>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                ...styles.tabBtn,
                background: activeTab === 'profile' ? 'rgba(0,212,170,0.1)' : 'transparent',
                borderLeft: activeTab === 'profile' ? '3px solid var(--accent)' : '3px solid transparent',
                color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              👤 Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              style={{
                ...styles.tabBtn,
                background: activeTab === 'password' ? 'rgba(0,212,170,0.1)' : 'transparent',
                borderLeft: activeTab === 'password' ? '3px solid var(--accent)' : '3px solid transparent',
                color: activeTab === 'password' ? 'var(--accent)' : 'var(--text-primary)',
              }}
            >
              🔒 Change Password
            </button>
          </nav>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, background: 'var(--bg-primary)' }}>
          {activeTab === 'profile' ? <EditProfile /> : <ChangePassword />}
        </div>
      </div>
    </div>
  );
}

function EditProfile() {
  const [user, setUser] = useState({ full_name: '', bio: '', profile_pic_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/users/me')
      .then(res => {
        setUser({
          full_name: res.data.full_name || '',
          bio: res.data.bio || '',
          profile_pic_url: res.data.profile_pic_url || ''
        });
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load profile');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      await API.put('/users/me', {
        full_name: user.full_name,
        bio: user.bio
      });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    setSaving(true);
    try {
      const { data } = await API.post('/users/me/profile-pic', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(prev => ({ ...prev, profile_pic_url: data.url }));
      setMessage('Profile picture updated successfully! 🖼️');
      setError('');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload picture. Try a smaller image or re-login.');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /></div>;

  return (
    <div style={{ padding: '2rem 3rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Edit Profile</h3>
      
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {user.profile_pic_url ? (
            <img src={`http://127.0.0.1:8000${user.profile_pic_url}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>U</span>
          )}
        </div>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Profile Picture</h4>
          <label style={{
            display: 'inline-block',
            padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)',
            transition: 'all 0.2s'
          }}>
            Change Photo
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicUpload} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className="input"
            value={user.full_name}
            onChange={e => setUser({ ...user, full_name: e.target.value })}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea
            className="input"
            value={user.bio}
            onChange={e => setUser({ ...user, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            style={{ minHeight: 100 }}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '1rem' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      await API.put('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: '2rem 3rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Change Password</h3>
      
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="input"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={saving || !currentPassword || !newPassword || !confirmPassword} style={{ marginTop: '1rem' }}>
          {saving ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  tabBtn: {
    padding: '1rem 1.5rem',
    textAlign: 'left',
    display: 'block',
    width: '100%',
    border: 'none',
    borderLeft: '3px solid transparent',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  }
};
