import { useEffect, useState, useRef } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Call() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [callState, setCallState] = useState('idle'); // idle | calling | ringing | connected
  const [callType, setCallType] = useState('video');  // audio | video
  const [remoteName, setRemoteName] = useState('');
  const [targetId, setTargetId] = useState(null);

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const ws = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);

  useEffect(() => {
    API.get('/users').then(r => setUsers(r.data));
    connectSignaling();
    return () => {
      cleanup();
      if (ws.current) ws.current.close();
    };
  }, []);

  const connectSignaling = () => {
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/signal?token=${token}`);
    socket.onmessage = async (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === 'call-request') {
        setRemoteName(msg.caller_name);
        setTargetId(msg.from_id);
        setCallType(msg.call_type || 'video');
        setCallState('ringing');
      }

      if (msg.type === 'offer') {
        await setupPC(msg.from_id, msg.call_type || 'video');
        await pc.current.setRemoteDescription(new RTCSessionDescription(msg.payload));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        ws.current.send(JSON.stringify({
          type: 'answer', target_id: msg.from_id, payload: answer
        }));
        setCallState('connected');
      }

      if (msg.type === 'answer') {
        await pc.current.setRemoteDescription(new RTCSessionDescription(msg.payload));
        setCallState('connected');
      }

      if (msg.type === 'ice-candidate' && pc.current) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(msg.payload));
        } catch { }
      }

      if (msg.type === 'call-end') {
        cleanup();
        setCallState('idle');
      }
    };
    ws.current = socket;
  };

  const setupPC = async (remoteId, type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: type === 'video',
      audio: true
    });
    localStream.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(t => peerConnection.addTrack(t, stream));

    peerConnection.ontrack = (e) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = e.streams[0];
    };

    peerConnection.onicecandidate = (e) => {
      if (e.candidate && ws.current) {
        ws.current.send(JSON.stringify({
          type: 'ice-candidate', target_id: remoteId, payload: e.candidate
        }));
      }
    };

    pc.current = peerConnection;
    return peerConnection;
  };

  const startCall = async (targetUser, type) => {
    setCallType(type);
    setTargetId(targetUser.id);
    setRemoteName(targetUser.username);
    setCallState('calling');

    // Send call request
    ws.current.send(JSON.stringify({
      type: 'call-request',
      target_id: targetUser.id,
      caller_name: user.username,
      call_type: type
    }));

    await setupPC(targetUser.id, type);
    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);
    ws.current.send(JSON.stringify({
      type: 'offer', target_id: targetUser.id, payload: offer, call_type: type
    }));
  };

  const answerCall = async () => {
    setCallState('connected');
    // The offer handler above already handles setting up the connection
  };

  const endCall = () => {
    if (ws.current && targetId) {
      ws.current.send(JSON.stringify({ type: 'call-end', target_id: targetId }));
    }
    cleanup();
    setCallState('idle');
  };

  const cleanup = () => {
    if (pc.current) { pc.current.close(); pc.current = null; }
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
  };

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOn(!camOn);
    }
  };

  return (
    <div style={{ flex: 1 }} className="animate-in">
      <Navbar title="Audio & Video Call" />

      {callState === 'idle' && (
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              📞 Start a Call
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Select a user and choose audio or video call. Both users must be on this page.
            </p>
          </div>

          {users.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👥</div>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No other users available</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {users.map(u => (
                <div key={u.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', color: 'white', fontWeight: 700
                  }}>{u.username[0].toUpperCase()}</div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                      onClick={() => startCall(u, 'audio')}>
                      🎤 Audio
                    </button>
                    <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                      onClick={() => startCall(u, 'video')}>
                      📹 Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {callState === 'ringing' && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📞</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Incoming {callType} Call
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
            {remoteName}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              onClick={answerCall}>
              ✅ Answer
            </button>
            <button className="btn-danger" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              onClick={endCall}>
              ❌ Decline
            </button>
          </div>
        </div>
      )}

      {callState === 'calling' && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="pulse" style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', margin: '0 auto 1.5rem'
          }}>📞</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Calling {remoteName}…
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{callType} call</p>
          <button className="btn-danger" style={{ padding: '0.75rem 2rem' }} onClick={endCall}>
            Cancel
          </button>
        </div>
      )}

      {callState === 'connected' && (
        <div>
          {/* Video area */}
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem', background: '#000', minHeight: callType === 'video' ? 450 : 200 }}>
            {callType === 'video' ? (
              <>
                <video ref={remoteVideo} autoPlay playsInline
                  style={{ width: '100%', height: 450, objectFit: 'cover' }} />
                <video ref={localVideo} autoPlay playsInline muted
                  style={{
                    position: 'absolute', bottom: 16, right: 16,
                    width: 160, height: 120, borderRadius: '12px',
                    border: '2px solid rgba(108,99,255,0.5)', objectFit: 'cover'
                  }} />
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '32px', color: 'white', fontWeight: 700, margin: '0 auto 0.5rem'
                  }}>{remoteName[0]?.toUpperCase()}</div>
                  <p style={{ color: 'white', fontWeight: 600 }}>{remoteName}</p>
                </div>
                {/* Hidden elements for audio */}
                <audio ref={remoteVideo} autoPlay />
                <audio ref={localVideo} autoPlay muted style={{ display: 'none' }} />
              </div>
            )}

            {/* Connected indicator */}
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'rgba(0,0,0,0.6)', borderRadius: '999px',
              padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06d6a0', display: 'inline-block' }} />
              <span style={{ color: 'white', fontSize: '0.78rem', fontWeight: 500 }}>Connected</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={toggleMic}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: micOn ? 'var(--bg-card)' : 'var(--danger)',
                border: '1px solid var(--border)', cursor: 'pointer',
                fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}>
              {micOn ? '🎤' : '🔇'}
            </button>
            {callType === 'video' && (
              <button onClick={toggleCam}
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: camOn ? 'var(--bg-card)' : 'var(--danger)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                {camOn ? '📹' : '🚫'}
              </button>
            )}
            <button onClick={endCall}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--danger)', border: 'none', cursor: 'pointer',
                fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white'
              }}>
              📵
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
