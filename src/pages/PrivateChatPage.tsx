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

type PrivateMessage = {
  id: number;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  text: string;
  image_url: string | null;
  created_at: string;
};

export function PrivateChatPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [members, setMembers] = useState<Account[]>([]);
  const [selectedMember, setSelectedMember] = useState<Account | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadAccount();
    void loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      void loadMessages();
    }
  }, [selectedMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadAccount() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('family_accounts').select('*').eq('user_id', user.id).single();
    if (data) {
      setAccount(data as Account);
    }
  }

  async function loadMembers() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('family_accounts').select('*').neq('user_id', user.id);
    if (data) {
      setMembers(data as Account[]);
    }
  }

  async function loadMessages() {
    if (!supabase || !account || !selectedMember) return;
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${account.user_id},receiver_id.eq.${selectedMember.user_id}),and(sender_id.eq.${selectedMember.user_id},receiver_id.eq.${account.user_id})`)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
  }

  async function uploadFile(file: File): Promise<string | null> {
    if (!supabase) return null;
    const ext = file.name.split('.').pop();
    const path = `private/${account?.user_id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('chat-files').upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from('chat-files').getPublicUrl(path);
    return data.publicUrl;
  }

  async function sendMessage() {
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

  if (!account) {
    return <div className="card">Загрузка...</div>;
  }

  if (!selectedMember) {
    return (
      <>
        <h1 className="page-title">💬 Личные сообщения</h1>
        <p className="page-lead">Выберите с кем хотите пообщаться</p>
        <div className="members-list">
          {members.map(member => (
            <button
              key={member.id}
              className="member-item"
              onClick={() => setSelectedMember(member)}
            >
              <div className="member-avatar" style={{ background: member.avatar_color }}>
                {member.avatar_url 
                  ? <img src={member.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : member.avatar_emoji}
              </div>
              <span className="member-name">{member.name}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="chat-header">
        <button className="pill" onClick={() => setSelectedMember(null)}>← Назад</button>
        <div className="chat-header-user">
          <div className="member-avatar-sm" style={{ background: selectedMember.avatar_color }}>
            {selectedMember.avatar_url 
              ? <img src={selectedMember.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : selectedMember.avatar_emoji}
          </div>
          <span>{selectedMember.name}</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="empty-chat">Начните общение с {selectedMember.name}</p>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === account.user_id;
            return (
              <div key={msg.id} className={`tg-message ${isOwn ? 'own' : ''}`}>
                <div className="tg-message-body">
                  <div className="tg-bubble">
                    {msg.image_url && (
                      <img src={msg.image_url} alt="image" className="tg-image" />
                    )}
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
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => { void handleFileSelect(e); }}
          style={{ display: 'none' }}
        />
        <button className="pill" onClick={() => fileInputRef.current?.click()}>📷</button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сообщение..."
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void sendMessage())}
        />
        <button className="send-btn" onClick={() => void sendMessage()} disabled={!input.trim() && !selectedImage}>→</button>
      </div>
    </>
  );
}
