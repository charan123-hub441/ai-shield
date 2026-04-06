import { useEffect, useState, useRef } from 'react';
import API, { BASE_URL } from '../api/axios';
import Navbar from '../components/Navbar';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [postWarning, setPostWarning] = useState(null);
  const [commentError, setCommentError] = useState(null);
  const fileRef = useRef();

  const loadPosts = () => {
    API.get('/posts').then(r => setPosts(r.data)).finally(() => setLoading(false));
  };

  useEffect(loadPosts, []);

  const handleMedia = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    const url = URL.createObjectURL(file);
    setPreview({ url, type: file.type.startsWith('video') ? 'video' : 'image' });
  };

  const createPost = async () => {
    if (!text.trim() && !media) return;
    setPosting(true);
    setPostWarning(null);
    const fd = new FormData();
    fd.append('content', text);
    if (media) fd.append('media', media);
    try {
      const { data } = await API.post('/posts', fd);
      // Check if the post was flagged
      if (data.is_flagged) {
        setPostWarning({
          label: data.flag_label,
          score: data.flag_score,
          warning: data.flag_warning,
          postId: data.id
        });
      }
      setText('');
      setMedia(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      loadPosts();
    } catch (err) {
      console.error("Post creation failed:", err.response?.data || err.message);
    }
    setPosting(false);
  };

  const toggleLike = async (id) => {
    await API.post(`/posts/${id}/like`);
    loadPosts();
  };

  const addComment = async (postId) => {
    const t = commentText[postId]?.trim();
    if (!t) return;
    try {
      await API.post(`/posts/${postId}/comment`, { text: t });
      setCommentText({ ...commentText, [postId]: '' });
      loadPosts();
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.detail) {
        setCommentError(err.response.data.detail);
      }
    }
  };

  const deletePost = async (id) => {
    await API.delete(`/posts/${id}`);
    setPostWarning(null);
    loadPosts();
  };

  return (
    <div className="animate-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <Navbar title="Social Feed" />

      {/* Comment Error Modal */}
      {commentError && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="card animate-in" style={{
            maxWidth: 400, width: '90%', padding: '2rem',
            background: 'var(--bg-card)', border: '2px solid rgba(255,0,0,0.3)',
            boxShadow: '0 10px 40px rgba(255,0,0,0.2)'
          }}>
            <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>🚨</div>
            <h2 style={{ color: '#ff3333', textAlign: 'center', marginBottom: '1rem', fontWeight: 800 }}>Content Blocked</h2>
            <p style={{ color: 'var(--text-primary)', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5, fontWeight: 500 }}>
              {commentError}
            </p>
            <button className="btn-danger" style={{ width: '100%', padding: '0.8rem' }} onClick={() => setCommentError(null)}>
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Post creation warning modal */}
      {postWarning && (
        <div style={{
          padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
          borderRadius: '14px',
          background: postWarning.label === 'Severe Harassment'
            ? 'linear-gradient(135deg, rgba(255,0,0,0.15), rgba(255,77,109,0.12))'
            : 'linear-gradient(135deg, rgba(255,77,109,0.12), rgba(255,190,11,0.08))',
          border: postWarning.label === 'Severe Harassment'
            ? '2px solid rgba(255,0,0,0.4)'
            : '2px solid rgba(255,77,109,0.35)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: postWarning.label === 'Severe Harassment'
                ? 'rgba(255,0,0,0.2)'
                : 'rgba(255,77,109,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0
            }}>
              {postWarning.label === 'Severe Harassment' ? '🚨' : '⚠️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{
                  fontSize: '0.85rem', fontWeight: 700,
                  color: postWarning.label === 'Severe Harassment' ? '#ff3333' : 'var(--danger)',
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                  {postWarning.label}
                </span>
                <span style={{
                  fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '999px',
                  background: 'rgba(255,77,109,0.2)', color: 'var(--danger)', fontWeight: 600
                }}>
                  {Math.round(postWarning.score * 100)}% Toxicity
                </span>
              </div>
              <p style={{
                fontSize: '0.85rem', lineHeight: 1.6, fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                {postWarning.warning}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                <button
                  className="btn-danger"
                  style={{ fontSize: '0.78rem', padding: '0.5rem 1rem', fontWeight: 600 }}
                  onClick={() => deletePost(postWarning.postId)}
                >
                  🗑️ Remove Post Now
                </button>
                <button
                  className="btn-ghost"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setPostWarning(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create post */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          ✏️ Create Post
        </h3>
        <textarea
          className="input"
          placeholder="What's on your mind?"
          style={{ minHeight: 80, marginBottom: '0.75rem' }}
          value={text}
          onChange={e => setText(e.target.value)}
        />

        {preview && (
          <div style={{ marginBottom: '0.75rem', borderRadius: '12px', overflow: 'hidden', maxHeight: 300 }}>
            {preview.type === 'image' ? (
              <img src={preview.url} alt="preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />
            ) : (
              <video src={preview.url} controls style={{ width: '100%', maxHeight: 300 }} />
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.85rem', borderRadius: '8px',
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
              transition: 'all 0.2s'
            }}>
              📷 Photo/Video
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMedia}
                style={{ display: 'none' }}
              />
            </label>
            {media && (
              <button className="btn-ghost" onClick={() => { setMedia(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}>
                ✕ Remove
              </button>
            )}
          </div>
          <button className="btn-primary" onClick={createPost} disabled={posting || (!text.trim() && !media)}>
            {posting ? <><span className="spinner" style={{ marginRight: 8 }} />Posting…</> : '🚀 Post'}
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No posts yet. Be the first!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map(post => (
            <div key={post.id} className="card animate-in" style={{
              borderColor: post.is_flagged
                ? (post.flag_label === 'Severe Harassment' ? 'rgba(255,0,0,0.4)' : 'rgba(255,77,109,0.3)')
                : undefined
            }}>
              {/* Flagged warning banner on post */}
              {post.is_flagged && (
                <div style={{
                  margin: '-1.5rem -1.5rem 1rem -1.5rem',
                  padding: '0.65rem 1.5rem',
                  background: post.flag_label === 'Severe Harassment'
                    ? 'linear-gradient(90deg, rgba(255,0,0,0.18), rgba(255,77,109,0.12))'
                    : 'linear-gradient(90deg, rgba(255,77,109,0.12), rgba(255,190,11,0.06))',
                  borderBottom: '1px solid rgba(255,77,109,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderRadius: '16px 16px 0 0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>{post.flag_label === 'Severe Harassment' ? '🚨' : '⚠️'}</span>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700,
                      color: post.flag_label === 'Severe Harassment' ? '#ff3333' : 'var(--danger)',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {post.flag_label} • {Math.round(post.flag_score * 100)}% Toxicity
                    </span>
                  </div>
                  <button
                    className="btn-danger"
                    style={{ fontSize: '0.68rem', padding: '0.25rem 0.6rem' }}
                    onClick={() => deletePost(post.id)}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Post warning text */}
              {post.flag_warning && (
                <div style={{
                  padding: '0.6rem 0.85rem', marginBottom: '0.75rem',
                  background: 'rgba(255,77,109,0.08)', borderRadius: '8px',
                  border: '1px solid rgba(255,77,109,0.15)',
                  fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 500,
                  lineHeight: 1.5
                }}>
                  {post.flag_warning}
                </div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, color: 'white'
                  }}>
                    {post.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{post.username}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button className="btn-ghost" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => deletePost(post.id)}>🗑️</button>
              </div>

              {/* Content */}
              {post.content && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                  {post.content}
                </p>
              )}

              {/* Media */}
              {post.media_url && (
                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '0.75rem', maxHeight: 400 }}>
                  {post.media_type === 'image' ? (
                    <img src={`${BASE_URL}${post.media_url}`} alt="post" style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />
                  ) : (
                    <video src={`${BASE_URL}${post.media_url}`} controls style={{ width: '100%', maxHeight: 400 }} />
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => toggleLike(post.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                    color: post.liked_by_me ? '#ff4d6d' : 'var(--text-secondary)',
                    fontWeight: post.liked_by_me ? 600 : 400
                  }}
                >
                  {post.liked_by_me ? '❤️' : '🤍'} {post.like_count}
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  💬 {post.comments.length}
                </span>
              </div>

              {/* Comments */}
              {post.comments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {post.comments.map(c => (
                    <div key={c.id} style={{
                      padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)',
                      borderRadius: '8px', fontSize: '0.82rem'
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{c.username}</span>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="input"
                  placeholder="Write a comment…"
                  style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
                  value={commentText[post.id] || ''}
                  onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addComment(post.id)}
                />
                <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.5rem 0.85rem' }}
                  onClick={() => addComment(post.id)}>
                  Send
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
