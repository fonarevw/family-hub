import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import '../components/Layout.css';

type Account = {
  id: number;
  user_id: string;
  name: string;
  avatar_emoji: string;
  avatar_color: string;
  avatar_url: string | null;
};

type GroupMessage = {
  id: number;
  user_id: string;
  nickname: string;
  avatar_emoji: string;
  avatar_color: string;
  avatar_url: string | null;
  text: string;
  image_url: string | null;
  created_at: string;
};

type PrivateMessage = {
  id: number;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  text: string;
  image_url: string | null;
  created_at: string;
};

export function ChatsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [members, setMembers] = useState<Account[]>([]);
  const [view, setView] = useState<'list' | 'group' | 'private'>('list');
  const [selectedMember, setSelectedMember] = useState<Account | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadAccount();
    void loadMembers();
  }, []);

  useEffect(() => {
    if (view === 'group') {
      void loadGroupMessages();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'private' && selectedMember) {
      void loadPrivateMessages();
    }
  }, [view, selectedMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, privateMessages]);

  async function loadAccount() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('family_accounts').select('*').eq('user_id', user.id).single();
    if (data) setAccount(data as Account);
  }

  async function loadMembers() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('family_accounts').select('*').neq('user_id', user.id);
    if (data) setMembers(data as Account[]);
  }

  async function loadGroupMessages() {
    if (!supabase) return;
    const { data } = await supabase.from('family_chat').select('*').order('created_at', { ascending: true }).limit(100);
    setGroupMessages(data ?? []);
  }

  async function loadPrivateMessages() {
    if (!supabase || !account || !selectedMember) return;
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${account.user_id},receiver_id.eq.${selectedMember.user_id}),and(sender_id.eq.${selectedMember.user_id},receiver_id.eq.${account.user_id})`)
      .order('created_at', { ascending: true });
    setPrivateMessages(data ?? []);
  }

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    if (!supabase) return null;
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-files').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('chat-files').getPublicUrl(path);
    return data.publicUrl;
  }

  async function sendGroupMessage() {
    const text = input.trim();
    if (!text && !selectedImage) return;
    if (!supabase || !account) return;

    await supabase.from('family_chat').insert({
      user_id: account.user_id,
      nickname: account.name,
      avatar_emoji: account.avatar_emoji,
      avatar_color: account.avatar_color,
      avatar_url: account.avatar_url,
      text: text || '📷 Фото',
      image_url: selectedImage,
    });

    setInput('');
    setSelectedImage(null);
    await loadGroupMessages();
  }

  async function sendPrivateMessage() {
    const text = input.trim();
    if (!text && !selectedImage) return;
    if (!supabase || !account || !selectedMember) return;

    await supabase.from('private_messages').insert({
      sender_id: account.user_id,
      sender_name: account.name,
      receiver_id: selectedMember.user_id,
      text: text || '📷 Фото',
      image_url: selectedImage,
    });

    setInput('');
    setSelectedImage(null);
    await loadPrivateMessages();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const folder = view === 'group' ? 'chat' : 'private';
    const url = await uploadFile(file, folder);
    if (url && file.type.startsWith('image/')) {
      setSelectedImage(url);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }

  if (!account) return <div className="card">Загрузка...</div>;

  if (view === 'list') {
    return (
      <>
        <h1 className="page-title">💬 Чаты</h1>
        <p className="page-lead">Выберите чат</p>
        
        <div className="chats-list">
          <button className="chat-item" onClick={() => setView('group')}>
            <div className="chat-avatar group">👨‍👩‍👧‍👦</div>
            <div className="chat-info">
              <span className="chat-name">Семейный чат</span>
              <span className="chat-preview">Группа для всех</span>
            </div>
            <span className="chat-badge">📌</span>
          </button>

          {members.map(member => (
            <button
              key={member.id}
              className="chat-item"
              onClick={() => { setSelectedMember(member); setView('private'); }}
            >
              <div className="chat-avatar" style={{ background: member.avatar_color }}>
                {member.avatar_url 
                  ? <img src={member.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : member.avatar_emoji}
              </div>
              <div className="chat-info">
                <span className="chat-name">{member.name}</span>
                <span className="chat-preview">Личное сообщение</span>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }

  if (view === 'group') {
    return (
      <>
        <div className="chat-header-bar">
          <button className="pill" onClick={() => setView('list')}>← Чаты</button>
          <span className="chat-header-title">👨‍👩‍👧‍👦 Семейный чат</span>
        </div>

        <div className="chat-messages">
          {groupMessages.map(msg => {
            const isOwn = msg.user_id === account.user_id;
            return (
              <div key={msg.id} className={`tg-message ${isOwn ? 'own' : ''}`}>
                {!isOwn && (
                  <div className="tg-avatar" style={{ background: msg.avatar_color }}>
                    {msg.avatar_url 
                      ? <img src={msg.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : msg.avatar_emoji}
                  </div>
                )}
                <div className="tg-message-body">
                  {!isOwn && <span className="tg-name">{msg.nickname}</span>}
                  <div className="tg-bubble">
                    {msg.image_url && <img src={msg.image_url} alt="image" className="tg-image" />}
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
          <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => { void handleFileSelect(e); }} style={{ display: 'none' }} />
          <button className="pill" onClick={() => fileInputRef.current?.click()}>📷</button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Сообщение..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void sendGroupMessage())} />
          <button className="send-btn" onClick={() => void sendGroupMessage()} disabled={!input.trim() && !selectedImage}>→</button>
        </div>
      </>
    );
  }

  if (view === 'private' && selectedMember) {
    return (
      <>
        <div className="chat-header-bar">
          <button className="pill" onClick={() => { setView('list'); setSelectedMember(null); }}>← Чаты</button>
          <span className="chat-header-title">
            <span style={{ background: selectedMember.avatar_color, borderRadius: '50%', padding: '4px 8px', marginRight: '8px' }}>
              {selectedMember.avatar_url 
                ? <img src={selectedMember.avatar_url} alt="avatar" style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '50%', verticalAlign: 'middle' }} />
                : selectedMember.avatar_emoji}
            </span>
            {selectedMember.name}
          </span>
        </div>

        <div className="chat-messages">
          {privateMessages.length === 0 ? (
            <p className="empty-chat">Начните общение с {selectedMember.name}</p>
          ) : (
            privateMessages.map(msg => {
              const isOwn = msg.sender_id === account.user_id;
              return (
                <div key={msg.id} className={`tg-message ${isOwn ? 'own' : ''}`}>
                  <div className="tg-message-body">
                    <div className="tg-bubble">
                      {msg.image_url && <img src={msg.image_url} alt="image" className="tg-image" />}
                      {msg.text && <p>{msg.text}</p>}
                      <span className="tg-time">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedImage && (
          <div className="image-preview">
            <img src={selectedImage} alt="preview" />
            <button onClick={() => setSelectedImage(null)}>✕</button>
          </div>
        )}

        <div className="chat-input">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => { void handleFileSelect(e); }} style={{ display: 'none' }} />
          <button className="pill" onClick={() => fileInputRef.current?.click()}>📷</button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Сообщение..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void sendPrivateMessage())} />
          <button className="send-btn" onClick={() => void sendPrivateMessage()} disabled={!input.trim() && !selectedImage}>→</button>
        </div>
      </>
    );
  }

  return null;
}
