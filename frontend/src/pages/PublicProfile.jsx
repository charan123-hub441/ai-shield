import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function PublicProfile() {
  const { userId } = useParams();
  const { user: currentUser, isOwner } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState("none");
  const [followerCount, setFollowerCount] = useState(0);

  // Owner panel state
  const [ownerData, setOwnerData] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (currentUser?.id === parseInt(userId)) {
      navigate('/settings');
      return;
    }
    fetchProfile();
    if (isOwner) {
      fetchOwnerData();
    }
  }, [userId, currentUser, isOwner]);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/users/${userId}/profile`);
      setProfile(res.data);
      setFollowStatus(res.data.follow_status || "none");
      setFollowerCount(res.data.followers_count);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerData = async () => {
    setOwnerLoading(true);
    try {
      const [userRes, allRes] = await Promise.all([
        API.get(`/owner/users/${userId}`),
        API.get('/owner/users')
      ]);
      setOwnerData(userRes.data);
      setTotalUsers(allRes.data.total_users);
    } catch (err) {
      console.error("Failed to load owner data", err);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (followStatus === 'accepted' || followStatus === 'pending') {
        await API.delete(`/users/${userId}/follow`);
        if (followStatus === 'accepted') {
            setFollowerCount(prev => prev - 1);
        }
        setFollowStatus('none');
      } else {
        const res = await API.post(`/users/${userId}/follow`);
        setFollowStatus(res.data.status);
      }
    } catch (err) {
      console.error("Failed to toggle follow status", err);
      alert("Error updating follow status.");
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Loading profile...</div>;
  if (!profile) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>User not found.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div className="card" style={{ display: 'flex', gap: '3rem', alignItems: 'center', padding: '3rem' }}>
        
        {/* Avatar */}
        <div style={{
            width: 150, height: 150, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '3rem',
            backgroundImage: profile.profile_pic_url ? `url(${BASE_URL}${profile.profile_pic_url})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          {!profile.profile_pic_url && profile.username[0].toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{profile.username}</h1>
            <button 
              onClick={handleFollowToggle}
              className="btn"
              style={{
                background: followStatus === 'accepted' ? 'transparent' : 'var(--accent)',
                color: followStatus === 'accepted' ? 'var(--text-primary)' : 'white',
                border: followStatus === 'accepted' ? '1px solid var(--border)' : 'none',
                padding: '0.5rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {followStatus === 'accepted' ? 'Following' : followStatus === 'pending' ? 'Requested' : 'Follow'}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>{followerCount}</strong> followers</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>{profile.following_count}</strong> following</div>
          </div>

          <div style={{ fontSize: '1.1rem' }}>
            {profile.full_name && <p style={{ fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{profile.full_name}</p>}
            <p style={{ margin: 0, lineHeight: '1.5', opacity: 0.8 }}>
              {profile.bio || 'No bio provided.'}
            </p>
          </div>
        </div>

      </div>

      {/* ── Owner-only panel ── */}
      {isOwner && (
        <div style={{
          marginTop: '1.5rem',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1.5px solid rgba(139, 92, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06))',
          boxShadow: '0 4px 24px rgba(139,92,246,0.15)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            background: 'linear-gradient(90deg, rgba(139,92,246,0.2), rgba(236,72,153,0.12))',
            borderBottom: '1px solid rgba(139,92,246,0.2)',
            display: 'flex', alignItems: 'center', gap: '0.6rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>👑</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#a78bfa', letterSpacing: '0.5px' }}>
              OWNER PANEL — Private View
            </span>
          </div>

          {ownerLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 0.5rem', width: 24, height: 24, borderWidth: 2 }} />
              Loading owner data...
            </div>
          ) : ownerData ? (
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

              {/* Total users stat */}
              <div style={{
                gridColumn: '1 / -1',
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', flexShrink: 0
                }}>👥</div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Registered Users
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {totalUsers}
                  </div>
                </div>
              </div>

              {/* User detail card */}
              <InfoTile icon="🪪" label="User ID" value={`#${ownerData.id}`} />
              <InfoTile icon="📧" label="Email" value={ownerData.email || '—'} />
              <InfoTile icon="🎭" label="Role" value={ownerData.role.toUpperCase()} />
              <InfoTile
                icon={ownerData.is_banned ? '🚫' : '✅'}
                label="Account Status"
                value={ownerData.is_banned ? 'Banned' : 'Active'}
                valueColor={ownerData.is_banned ? '#ff4d6d' : '#22c55e'}
              />
              <div style={{
                gridColumn: '1 / -1',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                  📅 Account Created
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(ownerData.created_at)}
                </div>
              </div>

            </div>
          ) : (
            <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Could not load owner data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoTile({ icon, label, value, valueColor }) {
  return (
    <div style={{
      padding: '0.85rem 1rem',
      borderRadius: '10px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}
