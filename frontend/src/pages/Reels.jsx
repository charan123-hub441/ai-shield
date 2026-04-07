import { useEffect, useState, useRef, useCallback } from 'react';
import API, { BASE_URL } from '../api/axios';

const BASE = BASE_URL;

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [commenting, setCommenting] = useState(false);
  const [mutedMap, setMutedMap] = useState({});
  const [likeAnimId, setLikeAnimId] = useState(null);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const scrollTimeout = useRef(null);

  const loadReels = useCallback(() => {
    API.get('/reels').then(r => {
      setReels(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(loadReels, [loadReels]);

  // Play/pause videos based on which one is current
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, el]) => {
      if (!el) return;
      if (parseInt(idx) === currentIndex) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [currentIndex, reels]);

  // Scroll handler for snapping
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const newIndex = Math.round(scrollTop / height);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentIndex(newIndex);
      }
    }, 100);
  }, [currentIndex, reels.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowDown' && currentIndex < reels.length - 1) {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, reels.length]);

  const scrollToIndex = (idx) => {
    const container = containerRef.current;
    if (!container) return;
    setCurrentIndex(idx);
    container.scrollTo({ top: idx * container.clientHeight, behavior: 'smooth' });
  };

  const toggleLike = async (reelId) => {
    setLikeAnimId(reelId);
    setTimeout(() => setLikeAnimId(null), 600);
    const { data } = await API.post(`/reels/${reelId}/like`);
    setReels(prev => prev.map(r =>
      r.id === reelId
        ? { ...r, liked_by_me: data.liked, like_count: r.like_count + (data.liked ? 1 : -1) }
        : r
    ));
  };

  const toggleMute = (reelId) => {
    setMutedMap(prev => ({ ...prev, [reelId]: !prev[reelId] }));
    const vid = videoRefs.current[currentIndex];
    if (vid) vid.muted = !vid.muted;
  };

  const addComment = async (reelId) => {
    if (!commentText.trim() || commenting) return;
    setCommenting(true);
    try {
      const { data } = await API.post(`/reels/${reelId}/comment`, { text: commentText });
      setReels(prev => prev.map(r =>
        r.id === reelId
          ? { ...r, comments: [...r.comments, data], comment_count: r.comment_count + 1 }
          : r
      ));
      setCommentText('');
    } catch (err) {
      if (err.response?.status === 400 && err.response.data?.detail) {
        setCommentError(err.response.data.detail);
      }
    } finally {
      setCommenting(false);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('caption', caption);
    fd.append('video', videoFile);
    try {
      await API.post('/reels', fd);
      setCaption('');
      setVideoFile(null);
      setShowUpload(false);
      loadReels();
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const deleteReel = async (reelId) => {
    await API.delete(`/reels/${reelId}`);
    loadReels();
  };

  const currentReel = reels[currentIndex];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: 16, fontWeight: 500 }}>Loading Reels...</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🎬</span>
          <h1 style={styles.headerTitle}>Reels</h1>
          <span style={styles.reelCount}>{reels.length}</span>
        </div>
        <button onClick={() => setShowUpload(true)} style={styles.uploadBtn}>
          <span style={{ fontSize: 18 }}>+</span>
          <span>Create Reel</span>
        </button>
      </div>

      {reels.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎥</div>
          <h2 style={styles.emptyTitle}>No Reels Yet</h2>
          <p style={styles.emptyText}>Be the first to share a reel!</p>
          <button onClick={() => setShowUpload(true)} style={styles.emptyBtn}>
            🎬 Create Your First Reel
          </button>
        </div>
      ) : (
        <div style={styles.reelsLayout}>
          {/* Main Reel Viewer */}
          <div style={styles.reelViewerWrapper}>
            <div
              ref={containerRef}
              style={styles.reelContainer}
              onScroll={handleScroll}
            >
              {reels.map((reel, index) => (
                <div key={reel.id} style={styles.reelSlide}>
                  {/* Video */}
                  <video
                    ref={el => videoRefs.current[index] = el}
                    src={`${BASE}${reel.video_url}`}
                    style={styles.video}
                    loop
                    muted={mutedMap[reel.id] !== false}
                    playsInline
                    onClick={() => {
                      const vid = videoRefs.current[index];
                      if (vid) vid.paused ? vid.play() : vid.pause();
                    }}
                  />

                  {/* Gradient overlay */}
                  <div style={styles.gradientOverlay} />

                  {/* Double-tap like animation */}
                  {likeAnimId === reel.id && (
                    <div style={styles.likeAnim}>❤️</div>
                  )}

                  {/* Bottom info */}
                  <div style={styles.bottomInfo}>
                    <div style={styles.userRow}>
                      <div style={styles.avatar}>
                        {reel.profile_pic_url ? (
                          <img src={`${BASE}${reel.profile_pic_url}`} alt="" style={styles.avatarImg} />
                        ) : (
                          <span style={styles.avatarLetter}>{reel.username[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <span style={styles.username}>@{reel.username}</span>
                      <span style={styles.timeAgo}>
                        {getTimeAgo(reel.created_at)}
                      </span>
                    </div>
                    {reel.caption && (
                      <p style={styles.captionText}>{reel.caption}</p>
                    )}
                    <div style={styles.musicRow}>
                      <span style={styles.musicIcon}>♪</span>
                      <span style={styles.musicText}>Original audio · {reel.username}</span>
                    </div>
                  </div>

                  {/* Side actions */}
                  <div style={styles.sideActions}>
                    <button style={styles.sideBtn} onClick={() => toggleLike(reel.id)}>
                      <span style={{
                        ...styles.sideBtnIcon,
                        color: reel.liked_by_me ? '#ff3366' : 'white',
                        transform: likeAnimId === reel.id ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.2s'
                      }}>
                        {reel.liked_by_me ? '❤️' : '🤍'}
                      </span>
                      <span style={styles.sideBtnLabel}>{formatCount(reel.like_count)}</span>
                    </button>

                    <button style={styles.sideBtn} onClick={() => setShowComments(!showComments)}>
                      <span style={styles.sideBtnIcon}>💬</span>
                      <span style={styles.sideBtnLabel}>{formatCount(reel.comment_count)}</span>
                    </button>

                    <button style={styles.sideBtn} onClick={() => toggleMute(reel.id)}>
                      <span style={styles.sideBtnIcon}>
                        {mutedMap[reel.id] === false ? '🔊' : '🔇'}
                      </span>
                      <span style={styles.sideBtnLabel}>
                        {mutedMap[reel.id] === false ? 'Sound' : 'Muted'}
                      </span>
                    </button>

                    <button style={styles.sideBtn} onClick={() => {
                      if (confirm('Delete this reel?')) deleteReel(reel.id);
                    }}>
                      <span style={styles.sideBtnIcon}>🗑️</span>
                      <span style={styles.sideBtnLabel}>Delete</span>
                    </button>

                    {/* Profile pic at bottom of actions */}
                    <div style={styles.sideProfile}>
                      <div style={styles.sideProfilePic}>
                        {reel.profile_pic_url ? (
                          <img src={`${BASE}${reel.profile_pic_url}`} alt="" style={styles.avatarImg} />
                        ) : (
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                            {reel.username[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div style={styles.progressDots}>
                    {reels.length <= 10 && reels.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.dot,
                          background: i === currentIndex
                            ? 'white'
                            : 'rgba(255,255,255,0.3)',
                          width: i === currentIndex ? 20 : 6,
                          borderRadius: 3,
                        }}
                        onClick={() => scrollToIndex(i)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            {currentIndex > 0 && (
              <button style={styles.navUp} onClick={() => scrollToIndex(currentIndex - 1)}>
                ▲
              </button>
            )}
            {currentIndex < reels.length - 1 && (
              <button style={styles.navDown} onClick={() => scrollToIndex(currentIndex + 1)}>
                ▼
              </button>
            )}
          </div>

          {/* Comments panel */}
          {showComments && currentReel && (
            <div style={styles.commentsPanel}>
              <div style={styles.commentsPanelHeader}>
                <h3 style={styles.commentsPanelTitle}>
                  Comments ({currentReel.comment_count})
                </h3>
                <button onClick={() => setShowComments(false)} style={styles.closeBtn}>✕</button>
              </div>

              <div style={styles.commentsList}>
                {currentReel.comments.length === 0 ? (
                  <div style={styles.noComments}>
                    <span style={{ fontSize: 40 }}>💬</span>
                    <p>No comments yet</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Be the first to comment
                    </p>
                  </div>
                ) : (
                  currentReel.comments.map(c => (
                    <div key={c.id} style={styles.commentItem}>
                      <div style={styles.commentAvatar}>
                        {c.username[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.commentHeader}>
                          <span style={styles.commentUser}>@{c.username}</span>
                          <span style={styles.commentTime}>{getTimeAgo(c.created_at)}</span>
                        </div>
                        <p style={styles.commentBody}>{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.commentInputRow}>
                <input
                  className="input"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment(currentReel.id)}
                  style={{ ...styles.commentInput, opacity: commenting ? 0.6 : 1 }}
                  disabled={commenting}
                />
                <button
                  onClick={() => addComment(currentReel.id)}
                  style={{
                    ...styles.commentSendBtn,
                    background: commenting
                      ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                      : styles.commentSendBtn.background,
                    minWidth: commenting ? 110 : undefined,
                    fontSize: commenting ? '0.72rem' : undefined,
                    gap: commenting ? '0.3rem' : undefined,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  disabled={!commentText.trim() || commenting}
                >
                  {commenting ? (
                    <>
                      <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, marginRight: 4 }} />
                      Analyzing...
                    </>
                  ) : '➤'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div style={styles.modalOverlay} onClick={() => setShowUpload(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🎬 Create New Reel</h2>
              <button onClick={() => setShowUpload(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.modalBody}>
              {/* Video file picker */}
              <div style={styles.uploadZone}>
                {videoFile ? (
                  <div style={styles.videoPreviewWrapper}>
                    <video
                      src={URL.createObjectURL(videoFile)}
                      style={styles.videoPreview}
                      controls
                    />
                    <button
                      style={styles.removeVideoBtn}
                      onClick={() => setVideoFile(null)}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label style={styles.uploadLabel}>
                    <div style={styles.uploadIconBig}>📹</div>
                    <p style={styles.uploadText}>Click to select a video</p>
                    <p style={styles.uploadSubtext}>MP4, WebM, MOV (max 100MB)</p>
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={e => setVideoFile(e.target.files[0])}
                    />
                  </label>
                )}
              </div>

              {/* Caption */}
              <textarea
                className="input"
                placeholder="Write a caption..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                style={styles.captionInput}
              />

              <button
                onClick={handleUpload}
                disabled={!videoFile || uploading}
                style={{
                  ...styles.publishBtn,
                  opacity: (!videoFile || uploading) ? 0.5 : 1,
                }}
              >
                {uploading ? (
                  <>
                    <span className="spinner" style={{ marginRight: 8 }} />
                    Uploading...
                  </>
                ) : (
                  '🚀 Publish Reel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

function getTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

const styles = {
  wrapper: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0 1.25rem 0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  headerIcon: {
    fontSize: '1.5rem',
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  reelCount: {
    fontSize: '0.72rem',
    fontWeight: 600,
    padding: '0.15rem 0.55rem',
    borderRadius: '999px',
    background: 'rgba(0, 212, 170, 0.12)',
    color: 'var(--accent)',
  },
  uploadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.6rem 1.2rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #ff3366, #ff6b6b, #ff9a56)',
    color: 'white',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255, 51, 102, 0.35)',
    transition: 'all 0.2s',
  },

  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '0.75rem',
  },
  emptyIcon: { fontSize: '4rem' },
  emptyTitle: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  emptyText: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  emptyBtn: {
    marginTop: '0.5rem',
    padding: '0.7rem 1.5rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #ff3366, #ff6b6b)',
    color: 'white',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255, 51, 102, 0.3)',
  },

  // Reels layout
  reelsLayout: {
    display: 'flex',
    gap: '1rem',
    flex: 1,
    minHeight: 0,
  },
  reelViewerWrapper: {
    position: 'relative',
    width: '380px',
    height: 'calc(100vh - 140px)',
    flexShrink: 0,
    borderRadius: '20px',
    overflow: 'hidden',
    background: '#000',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  },
  reelContainer: {
    width: '100%',
    height: '100%',
    overflowY: 'scroll',
    scrollSnapType: 'y mandatory',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  reelSlide: {
    width: '100%',
    height: '100%',
    scrollSnapAlign: 'start',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    flexShrink: 0,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
    pointerEvents: 'none',
  },

  // Like animation
  likeAnim: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '80px',
    animation: 'likeHeartPop 0.6s ease forwards',
    pointerEvents: 'none',
    zIndex: 10,
  },

  // Bottom info
  bottomInfo: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 70,
    zIndex: 5,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.4rem',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.3)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarLetter: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'white',
  },
  username: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: 'white',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
  },
  timeAgo: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.6)',
  },
  captionText: {
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 1.5,
    marginBottom: '0.4rem',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  musicRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  musicIcon: {
    fontSize: '0.8rem',
    color: 'white',
    animation: 'spin 3s linear infinite',
  },
  musicText: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.7)',
  },

  // Side actions
  sideActions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.2rem',
    zIndex: 5,
  },
  sideBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.15rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
  },
  sideBtnIcon: {
    fontSize: '1.5rem',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
  },
  sideBtnLabel: {
    fontSize: '0.68rem',
    color: 'white',
    fontWeight: 600,
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  },
  sideProfile: {
    marginTop: '0.5rem',
  },
  sideProfilePic: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff3366, #ff6b6b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '2px solid white',
  },

  // Progress dots
  progressDots: {
    position: 'absolute',
    right: 6,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    zIndex: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    cursor: 'pointer',
    transition: 'all 0.3s',
  },

  // Nav arrows
  navUp: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    color: 'white',
    width: 36,
    height: 36,
    borderRadius: '50%',
    fontSize: '1rem',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    transition: 'opacity 0.2s',
    opacity: 0.7,
  },
  navDown: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    color: 'white',
    width: 36,
    height: 36,
    borderRadius: '50%',
    fontSize: '1rem',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    transition: 'opacity 0.2s',
    opacity: 0.7,
  },

  // Comments panel
  commentsPanel: {
    flex: 1,
    minWidth: 300,
    maxWidth: 400,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 140px)',
  },
  commentsPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid var(--border)',
  },
  commentsPanelTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'var(--text-secondary)',
    width: 32,
    height: 32,
    borderRadius: '50%',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  commentsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  noComments: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  commentItem: {
    display: 'flex',
    gap: '0.65rem',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    color: 'white',
    flexShrink: 0,
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.2rem',
  },
  commentUser: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  commentTime: {
    fontSize: '0.68rem',
    color: 'var(--text-secondary)',
  },
  commentBody: {
    fontSize: '0.82rem',
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  },
  commentInputRow: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem',
    borderTop: '1px solid var(--border)',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    fontSize: '0.85rem',
    padding: '0.6rem 0.85rem',
    borderRadius: '999px',
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #ff3366, #ff6b6b)',
    color: 'white',
    fontSize: '1.1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.2s',
  },

  // Upload modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  },
  modalContent: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    width: '90%',
    maxWidth: 520,
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  modalBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  uploadZone: {
    borderRadius: '16px',
    border: '2px dashed var(--border)',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 2rem',
    cursor: 'pointer',
    gap: '0.5rem',
    transition: 'background 0.2s',
  },
  uploadIconBig: {
    fontSize: '3rem',
    marginBottom: '0.3rem',
  },
  uploadText: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  uploadSubtext: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  videoPreviewWrapper: {
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'cover',
  },
  removeVideoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(0,0,0,0.7)',
    border: 'none',
    color: 'white',
    padding: '0.35rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  captionInput: {
    minHeight: 80,
    resize: 'vertical',
  },
  publishBtn: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #ff3366, #ff6b6b, #ff9a56)',
    color: 'white',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255, 51, 102, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s, transform 0.15s',
  },
};
