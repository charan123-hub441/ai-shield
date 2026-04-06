import { useState, useEffect, useRef } from 'react';
import API, { BASE_URL } from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', bio: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const loadProfile = async () => {
    try {
      const { data } = await API.get('/users/me');
      setProfile(data);
      setForm({ full_name: data.full_name || '', bio: data.bio || '' });
      
      // Get only my posts
      const postsRes = await API.get('/posts');
      setPosts(postsRes.data.filter(p => p.username === data.username));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.put('/users/me', form);
      setProfile(data);
      setEditing(false);
      // Update local storage/context
      login(localStorage.getItem('token'), { ...user, ...data });
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await API.post('/users/me/profile-pic', fd);
      setProfile({ ...profile, profile_pic_url: data.url });
      login(localStorage.getItem('token'), { ...user, profile_pic_url: data.url });
    } catch (err) {
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div className="animate-in" style={{ flex: 1 }}>
      <Navbar title="Profile" />

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div className="card" style={{ 
          display: 'flex', gap: '2.5rem', alignItems: 'center', padding: '2.5rem',
          marginBottom: '2rem', background: 'var(--bg-card)', position: 'relative',
          overflow: 'hidden'
        }}>
           {/* Background Decoration */}
           <div style={{
             position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px',
             borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
             pointerEvents: 'none'
           }} />

          {/* Avatar Area */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6c63ff, #ec4899)',
              padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative'
              }}>
                {profile?.profile_pic_url ? (
                  <img src={`${BASE_URL}${profile.profile_pic_url}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent)' }}>
                    {profile?.username?.[0]?.toUpperCase()}
                  </span>
                )}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 5, right: 5, width: 32, height: 32,
                borderRadius: '50%', background: 'var(--accent)', color: 'white',
                border: '3px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              📷
            </button>
            <input type="file" ref={fileRef} onChange={handleAvatarUpload} hidden accept="image/*" />
          </div>

          {/* Info Area */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {profile?.username}
              </h2>
              <button 
                className="btn-ghost" 
                style={{ height: '34px', fontSize: '0.82rem', fontWeight: 600 }}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.post_count}</span> 
                <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>posts</span>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.warn_count}</span> 
                <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>violations</span>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>{profile?.full_name || 'No Name Set'}</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {profile?.bio || "No bio yet. Click Edit Profile to add one!"}
              </p>
            </div>
            {profile?.is_banned && (
                <div style={{ marginTop: '1rem',  display: 'inline-block', padding: '0.2rem 0.6rem', background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', color: '#ff4d6d', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                    BANNED ACCOUNT
                </div>
            )}
          </div>
        </div>

        {/* Post Grid */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ 
            display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '1.5rem',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            <span style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--text-primary)', paddingTop: '1rem', marginTop: '-1rem' }}>
              📁 Posts
            </span>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem'
          }}>
            {posts.length === 0 ? (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📸</p>
                <p>No posts yet</p>
              </div>
            ) : posts.map(post => (
              <div key={post.id} style={{ 
                aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', 
                background: 'var(--bg-secondary)', cursor: 'pointer',
                position: 'relative'
              }}>
                {post.media_url ? (
                  post.media_type === 'image' ? (
                    <img src={`${BASE_URL}${post.media_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <video src={`${BASE_URL}${post.media_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )
                ) : (
                  <div style={{ padding: '1rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {post.content}
                  </div>
                )}
                {post.is_flagged && (
                    <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(255,0,0,0.8)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                        FLAGGED
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', z_index: 100, padding: '1rem'
        }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Edit Profile</h3>
              <button className="btn-ghost" onClick={() => setEditing(false)} style={{ border: 'none', fontSize: '1.25rem' }}>✕</button>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  className="input" 
                  value={form.full_name} 
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                  placeholder="E.g. John Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea 
                  className="input" 
                  style={{ minHeight: 100 }}
                  value={form.bio} 
                  onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                  placeholder="Tell us about yourself..."
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
