import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function PublicProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState("none");
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    // If they clicked on themselves, redirect to their own settings/profile editor
    if (currentUser?.id === parseInt(userId)) {
      navigate('/settings');
      return;
    }
    fetchProfile();
  }, [userId, currentUser]);

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
    </div>
  );
}
