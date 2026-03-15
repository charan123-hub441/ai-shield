import { useEffect, useState, useRef } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const ws = useRef(null);
  const messagesEnd = useRef(null);

  const loadConversations = () => {
    API.get('/conversations').then(r => { setConversations(r.data); setLoading(false); });
  };

  const loadUsers = () => {
    API.get('/users').then(r => setUsers(r.data));
  };

  useEffect(() => {
    loadConversations();
    loadUsers();
  }, []);

  useEffect(() => {
    if (messagesEnd.current) messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (conv) => {
    // Close old WebSocket
    if (ws.current) ws.current.close();

    setActiveConv(conv);
    API.get(`/conversations/${conv.id}/messages`).then(r => setMessages(r.data));

    // Open WebSocket
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${conv.id}?token=${token}`);
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    ws.current = socket;
  };

  const sendMessage = () => {
    if (!text.trim() || !ws.current) return;
    ws.current.send(JSON.stringify({ text }));
    setText('');
  };

  const startConversation = async (username) => {
    try {
      const { data } = await API.post('/conversations', { username });
      setShowUsers(false);
      loadConversations();
      openConversation(data);
    } catch { }
  };

  useEffect(() => {
    return () => { if (ws.current) ws.current.close(); };
  }, []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }} className="animate-in">
      <Navbar title="Chat" />

      <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
        {/* Sidebar: conversations */}
        <div style={{
          width: 280, background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>💬 Conversations</h3>
            <button className="btn-primary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
              onClick={() => setShowUsers(!showUsers)}>
              {showUsers ? '✕' : '＋'}
            </button>
          </div>

          {/* User picker */}
          {showUsers && (
            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', maxHeight: 180, overflowY: 'auto' }}>
              {users.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0.5rem', textAlign: 'center' }}>No other users yet</p>
              ) : users.map(u => (
                <button key={u.id} onClick={() => startConversation(u.username)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-primary)', fontSize: '0.82rem', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                  onMouseOver={e => e.target.style.background = 'rgba(108,99,255,0.1)'}
                  onMouseOut={e => e.target.style.background = 'none'}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', color: 'white', fontWeight: 700, flexShrink: 0
                  }}>{u.username[0].toUpperCase()}</span>
                  {u.username}
                </button>
              ))}
            </div>
          )}

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ width: 24, height: 24 }} />
              </div>
            ) : conversations.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '1.5rem', textAlign: 'center' }}>
                No conversations yet.<br />Click ＋ to start one!
              </p>
            ) : conversations.map(c => (
              <button key={c.id}
                onClick={() => openConversation(c)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.85rem 1rem',
                  background: activeConv?.id === c.id ? 'rgba(108,99,255,0.12)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.65rem'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', color: 'white', fontWeight: 700, flexShrink: 0
                }}>{c.other_user[0].toUpperCase()}</div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.other_user}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.last_message || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {!activeConv ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem' }}>
              <div style={{ fontSize: '4rem' }}>💬</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Select a conversation to start chatting
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '0.65rem'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', color: 'white', fontWeight: 700
                }}>{activeConv.other_user[0].toUpperCase()}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{activeConv.other_user}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--success)' }}>● Online</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {messages.map(m => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id} style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '70%'
                    }}>
                      <div style={{
                        padding: '0.6rem 0.95rem',
                        borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isMe
                          ? 'linear-gradient(135deg, #6c63ff, #8b5cf6)'
                          : 'var(--bg-secondary)',
                        color: isMe ? 'white' : 'var(--text-primary)',
                        fontSize: '0.875rem', lineHeight: 1.5
                      }}>
                        {!isMe && <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.15rem' }}>{m.sender_username}</p>}
                        {m.text}
                      </div>
                      <p style={{
                        fontSize: '0.65rem', color: 'var(--text-secondary)',
                        marginTop: '0.2rem', textAlign: isMe ? 'right' : 'left'
                      }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>

              {/* Input */}
              <div style={{
                padding: '0.75rem 1rem', borderTop: '1px solid var(--border)',
                display: 'flex', gap: '0.5rem'
              }}>
                <input
                  className="input"
                  placeholder="Type a message…"
                  style={{ flex: 1 }}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn-primary" onClick={sendMessage} disabled={!text.trim()}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
