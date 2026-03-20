import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, X, Send } from 'lucide-react';
import { SOCKET_URL } from '../types';

interface ChatMessage {
  id: string; text: string; senderId: string; senderRole?: string; timestamp: string;
}

interface NewMsgAlert {
  room: string; senderId: string; text: string; timestamp: string;
}

interface Props {
  userId: string;
  userRole?: string;           // 'USER' | 'ADMIN'
  isAdmin?: boolean;
  adminRoomId?: string;        // For admin: which room to open
}

export default function LiveChat({ userId, userRole = 'USER', isAdmin = false, adminRoomId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);

  // For admin: incoming user message alerts
  const [alerts, setAlerts] = useState<NewMsgAlert[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomId = adminRoomId || `chat_${userId}`;

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', roomId);
      // If admin: also join the global admin_room for push notifications
      if (isAdmin) {
        socket.emit('join_admin');
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('receive_message', (data: ChatMessage) => {
      if (data.senderId !== userId) {
        setMessages(prev => [...prev, data]);
        if (!open) setUnread(u => u + 1);
      }
    });

    socket.on('typing', (data: { senderId: string }) => {
      if (data.senderId !== userId) {
        setTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(false), 2000);
      }
    });

    // Admin notification: user sent a message in some room
    if (isAdmin) {
      socket.on('new_user_message', (data: NewMsgAlert) => {
        setAlerts(prev => {
          // Avoid duplicates for same room
          if (prev.some(a => a.room === data.room)) return prev;
          return [...prev, data];
        });
        if (!open) setUnread(u => u + 1);
      });
    }

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, isAdmin]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setAlerts([]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  }, [open, messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      senderId: userId,
      senderRole: userRole,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    socketRef.current.emit('send_message', { ...msg, room: roomId });
    setInput('');
  };

  const handleTyping = (v: string) => {
    setInput(v);
    socketRef.current?.emit('typing', { room: roomId, senderId: userId });
  };

  const welcomeMsg: ChatMessage = {
    id: 'welcome',
    text: isAdmin
      ? 'Admin panel chat. Pilih percakapan untuk membalas.'
      : 'Halo! Selamat datang di Hurr Store 👋  Ada yang bisa kami bantu?',
    senderId: 'system',
    timestamp: new Date().toISOString(),
  };
  const allMessages = messages.length === 0 ? [welcomeMsg] : messages;

  return (
    <>
      {/* FAB */}
      <button className="chat-fab" onClick={() => setOpen(o => !o)} aria-label="Live Chat"
        style={{ position:'fixed', bottom:20, right:20, zIndex:1000 }}>
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        <div style={{
          position:'absolute', bottom:4, right:4,
          width:10, height:10, borderRadius:'50%',
          background: connected ? '#10b981' : '#ef4444',
          border:'2px solid white',
        }} />
        {(unread > 0 || alerts.length > 0) && !open && (
          <span style={{
            position:'absolute', top:-4, right:-4,
            background: 'var(--danger)', color:'white', borderRadius:'50%',
            width:18, height:18, fontSize:10, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>{Math.max(unread, alerts.length)}</span>
        )}
      </button>

      {/* Admin alerts toast (outside chat window) */}
      {isAdmin && alerts.length > 0 && !open && (
        <div style={{ position:'fixed', bottom:80, right:20, zIndex:999, display:'flex', flexDirection:'column', gap:6 }}>
          {alerts.slice(-3).map(a => (
            <div key={a.room} style={{
              background:'white', borderRadius:10, padding:'10px 14px',
              boxShadow:'0 4px 20px rgba(0,0,0,0.15)', fontSize:12,
              borderLeft:'3px solid var(--purple-500)', maxWidth:260,
              display:'flex', alignItems:'center', gap:8,
            }}>
              <MessageCircle size={14} color="var(--purple-500)"/>
              <div>
                <div style={{ fontWeight:700 }}>Pesan baru!</div>
                <div style={{ color:'var(--text-secondary)' }}>{a.senderId}: {a.text.slice(0,40)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">
                <MessageCircle size={15} style={{ display:'inline', marginRight:6 }}/>
                {isAdmin ? 'Live Chat Admin' : 'Live Chat Support'}
              </div>
              <div className="chat-header-sub">
                {connected
                  ? (isAdmin ? '🟢 Admin mode aktif' : '🟢 Admin siap membantu')
                  : '🔴 Menyambungkan...'}
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}><X size={16}/></button>
          </div>

          <div className="chat-messages">
            {allMessages.map(msg => (
              <div key={msg.id} className={`chat-msg ${msg.senderId === userId ? 'me' : 'other'}`}>
                <div className="chat-msg-text">{msg.text}</div>
                <div className="chat-msg-time">
                  {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}
                  {msg.senderId === userId && ' ✓✓'}
                </div>
              </div>
            ))}
            {typing && <div className="chat-typing">{isAdmin ? 'User' : 'Admin'} sedang mengetik…</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-wrap">
            <input
              className="chat-input"
              placeholder={connected ? 'Tulis pesan…' : 'Menghubungkan...'}
              value={input}
              disabled={!connected}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button className="chat-send" onClick={sendMessage}
              disabled={!connected || !input.trim()}>
              <Send size={15}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
