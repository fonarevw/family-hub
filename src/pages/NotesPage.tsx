import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import '../components/Layout.css';

type Account = {
  id: string;
  name: string;
  birthday: string | null;
  avatar_emoji: string;
  avatar_color: string;
  avatar_url: string | null;
  user_id: string;
};

type Message = {
  id: string;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  avatar_color: string;
  avatar_url: string | null;
  text: string;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

export function NotesPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadAccount();
    void loadMessages();
    
    const interval = setInterval(() => void loadMessages(), 2000);
    return () => clearInterval(interval);
  }, []);

  async function loadAccount() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('family_accounts').select('*').eq('user_id', user.id).single();
    if (data) {
      setAccount(data as Account);
    }
  }

  async function loadMessages() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('family_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200);
    if (!error && data) {
      setMessages(data);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function uploadFile(file: File): Promise<string | null> {
    if (!supabase) return null;
    const ext = file.name.split('.').pop();
    const path = `chat/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-files').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data } = supabase.storage.from('chat-files').getPublicUrl(path);
    return data.publicUrl;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !selectedImage) return;
    if (!supabase || !account) return;

    const { error } = await supabase.from('family_chat').insert({
      user_id: account.id,
      nickname: account.name,
      avatar_emoji: account.avatar_emoji,
      avatar_color: account.avatar_color,
      avatar_url: account.avatar_url,
      text: text || (selectedImage ? '📷 Фото' : ''),
      image_url: selectedImage,
      file_url: null,
      file_name: null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Send error:', error);
      return;
    }

    setInput('');
    setSelectedImage(null);
    await loadMessages();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url && file.type.startsWith('image/')) {
      setSelectedImage(url);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }

  function renderAvatar(msg: Message) {
    if (msg.avatar_url) {
      return <img src={msg.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return msg.avatar_emoji;
  }

  if (!account) {
    return (
      <div className="nickname-setup">
        <h1 className="page-title">💬 Семейный чат</h1>
        <p className="page-lead">Сначала войди в аккаунт</p>
      </div>
    );
  }

  return (
    <>
      <div className="chat-header">
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>💬 Семейный чат</h1>
          <p className="page-lead" style={{ margin: 0 }}>Общайтесь всей семьёй</p>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          const isOwn = msg.user_id === account.id;
          
          return (
            <div key={msg.id} className={`tg-message ${isOwn ? 'own' : ''}`}>
              {!isOwn && (
                <div className="tg-avatar" style={{ background: msg.avatar_color }}>
                  {renderAvatar(msg)}
                </div>
              )}
              <div className="tg-message-body">
                {!isOwn && <span className="tg-name">{msg.nickname}</span>}
                <div className="tg-bubble">
                  {msg.image_url && (
                    <img 
                      src={msg.image_url} 
                      alt="image" 
                      className="tg-image"
                      onClick={() => window.open(msg.image_url!, '_blank')}
                    />
                  )}
                  {msg.file_url && !msg.image_url && (
                    <a href={msg.file_url} target="_blank" rel="noopener" className="file-link">
                      📎 {msg.file_name}
                    </a>
                  )}
                  {msg.text && <p>{msg.text}</p>}
                  <span className="tg-time">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {selectedImage && (
        <div className="image-preview">
          <img src={selectedImage} alt="preview" />
          <button onClick={() => setSelectedImage(null)}>✕</button>
        </div>
      )}

      <div className="chat-input">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => { void handleFileSelect(e); }}
          style={{ display: 'none' }}
        />
        <button className="pill" onClick={() => fileInputRef.current?.click()} title="Прикрепить фото">
          📷
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши сообщение..."
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void sendMessage())}
        />
        <button 
          className="send-btn"
          onClick={() => void sendMessage()}
          disabled={!input.trim() && !selectedImage}
        >
          →
        </button>
      </div>
    </>
  );
}
