import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocalStorage } from '../hooks/useLocalStorage';
import '../components/Layout.css';

type Message = {
  id: number;
  user_id: string;
  nickname: string;
  avatar: string;
  text: string;
  created_at: string;
};

const avatars = ['😀', '😎', '🤗', '🥰', '😇', '🤠', '🧑‍💻', '👨‍🍳', '👩‍🎨', '🧑‍🚀'];
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

function getAvatar(nickname: string): string {
  const hash = nickname.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return avatars[hash % avatars.length];
}

function getColor(nickname: string): string {
  const hash = nickname.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function NotesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nickname, setNickname] = useLocalStorage('family_nickname', '');
  const [newNickname, setNewNickname] = useState('');
  const [input, setInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    if (!supabase) return;
    const { data } = await supabase
      .from('family_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages(data ?? []);
  }

  useEffect(() => {
    void loadMessages();
    const interval = setInterval(() => void loadMessages(), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || !supabase || !nickname) return;
    await supabase.from('family_chat').insert({
      user_id: 'local',
      nickname,
      avatar: getAvatar(nickname),
      text,
      created_at: new Date().toISOString(),
    });
    setInput('');
    await loadMessages();
  }

  function saveNickname() {
    const name = newNickname.trim();
    if (!name) return;
    setNickname(name);
    setIsEditingName(false);
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Сегодня';
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  }

  if (!nickname) {
    return (
      <div className="nickname-setup">
        <h1 className="page-title">💬 Семейный чат</h1>
        <p className="page-lead">Как тебя зовут?</p>
        <div className="card nickname-card">
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="Введи имя..."
            onKeyDown={(e) => e.key === 'Enter' && void saveNickname()}
            autoFocus
          />
          <button className="btn-primary" onClick={() => void saveNickname()}>
            Войти в чат
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="chat-header">
        <h1 className="page-title">💬 Семейный чат</h1>
        <button className="edit-name-btn" onClick={() => { setNewNickname(nickname); setIsEditingName(true); }}>
          {getAvatar(nickname)} {nickname} ▼
        </button>
      </div>

      {isEditingName && (
        <div className="card nickname-edit">
          <p>Изменить имя:</p>
          <div className="nickname-edit-form">
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void saveNickname()}
              autoFocus
            />
            <button className="pill" onClick={() => void saveNickname()}>✓</button>
            <button className="pill" onClick={() => setIsEditingName(false)}>✕</button>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const showDate = !prevMsg || formatDate(msg.created_at) !== formatDate(prevMsg.created_at);
          const isOwn = msg.nickname === nickname;
          
          return (
            <div key={msg.id}>
              {showDate && <div className="date-divider">{formatDate(msg.created_at)}</div>}
              <div className={`message ${isOwn ? 'own' : ''}`}>
                {!isOwn && (
                  <div className="message-avatar" style={{ background: getColor(msg.nickname) }}>
                    {msg.avatar}
                  </div>
                )}
                <div className={`message-content ${isOwn ? 'own' : ''}`}>
                  {!isOwn && <span className="message-nickname">{msg.nickname}</span>}
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши сообщение..."
        />
        <button type="submit" disabled={!input.trim()}>→</button>
      </form>
    </>
  );
}
