import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { BASE_URL } from '../api/axios';

export default function FollowRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await API.get('/users/me/follow-requests');
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to load follow requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (followerId) => {
    try {
      await API.post(`/users/requests/${followerId}/accept`);
      setRequests(requests.filter(r => r.follower_id !== followerId));
    } catch (err) {
      console.error("Failed to accept request", err);
      alert("Failed to accept request");
    }
  };

  const handleReject = async (followerId) => {
    try {
      await API.post(`/users/requests/${followerId}/reject`);
      setRequests(requests.filter(r => r.follower_id !== followerId));
    } catch (err) {
      console.error("Failed to reject request", err);
      alert("Failed to reject request");
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Loading requests...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Follow Requests</h2>
      
      {requests.length === 0 ? (
        <p style={{ opacity: 0.7, textAlign: 'center' }}>No pending follow requests.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(req => (
            <div key={req.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to={`/user/${req.follower_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #ec4899)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '1.2rem',
                    backgroundImage: req.follower_profile_pic_url ? `url(${BASE_URL}${req.follower_profile_pic_url})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center'
                  }}>
                    {!req.follower_profile_pic_url && req.follower_username[0].toUpperCase()}
                  </div>
                </Link>
                <Link to={`/user/${req.follower_id}`} style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {req.follower_username}
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleAccept(req.follower_id)} 
                  className="btn" 
                  style={{ background: 'var(--success)', padding: '0.4rem 1rem' }}
                >
                  Confirm
                </button>
                <button 
                  onClick={() => handleReject(req.follower_id)} 
                  className="btn" 
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.4rem 1rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
