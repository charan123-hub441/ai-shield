import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { BASE_URL } from '../api/axios';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchUsers();
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await API.get(`/users/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Search Friends</h2>
      
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search by username or name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field"
          style={{ paddingLeft: '2.5rem', fontSize: '1.1rem' }}
          autoFocus
        />
        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
          🔍
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading && <p style={{ textAlign: 'center', opacity: 0.5 }}>Searching...</p>}
        
        {!isLoading && query.length >= 2 && results.length === 0 && (
          <p style={{ textAlign: 'center', opacity: 0.5 }}>No users found.</p>
        )}

        {results.map(user => (
          <div 
            key={user.id} 
            className="card"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', 
              padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s' 
            }}
            onClick={() => navigate(`/user/${user.id}`)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '1.2rem',
              backgroundImage: user.profile_pic_url ? `url(${BASE_URL}${user.profile_pic_url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center'
            }}>
              {!user.profile_pic_url && user.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user.username}</h3>
              {user.full_name && <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>{user.full_name}</p>}
            </div>
            <button className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
