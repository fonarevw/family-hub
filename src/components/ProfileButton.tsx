import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './Layout.css';
import './ProfileModal.css';

type Account = {
  id: number;
  user_id: string;
  name: string;
  birthday: string | null;
  avatar_emoji: string;
  avatar_color: string;
  avatar_url: string | null;
};

const emojis = ['😀', '😎', '🤗', '🥰', '😇', '🤠', '🧑‍💻', '👨‍🍳', '👩‍🎨', '🧑‍🚀', '🦊', '🐱', '🐶', '🦁', '🐼', '🐸', '🦄', '🐰', '🐻', '🦋'];
const colors = ['#1d7a57', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A'];

export function ProfileButton() {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(emojis[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void checkUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
        setShowEdit(false);
      }
    }
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  async function checkUser() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    if (user) {
      void loadAccount(user.id);
    }
  }

  async function loadAccount(userId: string) {
    if (!supabase) return;
    const { data } = await supabase.from('family_accounts').select('*').eq('user_id', userId).single();
    if (data) {
      setAccount(data as Account);
      setName(data.name);
      setBirthday(data.birthday || '');
      setSelectedEmoji(data.avatar_emoji);
      setSelectedColor(data.avatar_color);
      setAvatarUrl(data.avatar_url);
    }
  }

  if (!isLoggedIn) return null;

  async function uploadAvatar(file: File) {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from('chat-files').upload(path, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('chat-files').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAvatar(file);
    if (url) {
      setAvatarUrl(url);
      if (account && supabase) {
        await supabase.from('family_accounts').update({ avatar_url: url }).eq('id', account.id);
        setAccount({ ...account, avatar_url: url });
      }
    }
  }

  async function updateProfile() {
    if (!supabase || !account) return;
    setError('');
    
    const { error: updateError } = await supabase
      .from('family_accounts')
      .update({
        name: name || account.name,
        birthday: birthday || null,
        avatar_emoji: selectedEmoji,
        avatar_color: selectedColor,
        avatar_url: avatarUrl,
      })
      .eq('id', account.id);
    
    if (updateError) {
      setError(updateError.message);
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await loadAccount(user.id);
    setShowEdit(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <>
      <button className="profile-btn" onClick={() => setShowModal(true)}>
        <div className="profile-btn-avatar" style={{ background: account?.avatar_color || colors[0] }}>
          {account?.avatar_url 
            ? <img src={account.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : account?.avatar_emoji || '👤'}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="profile-modal" ref={modalRef}>
            {!showEdit ? (
              <>
                <div className="profile-modal-header">
                  <div className="profile-modal-avatar" style={{ background: account?.avatar_color || colors[0] }}>
                    {account?.avatar_url 
                      ? <img src={account.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : account?.avatar_emoji || '👤'}
                  </div>
                  <div>
                    <h3>{account?.name || 'Профиль'}</h3>
                    {account?.birthday && (
                      <p className="profile-modal-birthday">🎂 {new Date(account.birthday).toLocaleDateString('ru')}</p>
                    )}
                  </div>
                </div>
                <div className="profile-modal-actions">
                  <button className="profile-modal-btn" onClick={() => setShowEdit(true)}>
                    ✏️ Редактировать профиль
                  </button>
                  <button className="profile-modal-btn logout" onClick={() => void signOut()}>
                    🚪 Выйти
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="profile-edit-header">
                  <button className="back-btn" onClick={() => setShowEdit(false)}>←</button>
                  <h3>Редактировать</h3>
                </div>
                <div className="profile-edit-body">
                  <input type="file" accept="image/*" ref={avatarInputRef} onChange={(e) => void handleAvatarSelect(e)} style={{ display: 'none' }} />
                  <div className="avatar-edit-section">
                    <div className="avatar-edit-preview" style={{ background: selectedColor }}>
                      {avatarUrl 
                        ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <span style={{ fontSize: '3rem' }}>{selectedEmoji}</span>}
                    </div>
                    <button className="btn-secondary" onClick={() => avatarInputRef.current?.click()}>
                      📷 Загрузить фото
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Имя:</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>День рождения:</label>
                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                  </div>
                  <div className="emoji-section">
                    <label>Эмодзи:</label>
                    <div className="emoji-grid">
                      {emojis.map(e => (
                        <button
                          key={e}
                          type="button"
                          className={selectedEmoji === e ? 'selected' : ''}
                          style={{ background: selectedEmoji === e ? selectedColor : undefined }}
                          onClick={() => setSelectedEmoji(e)}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="color-section">
                    <label>Цвет:</label>
                    <div className="color-grid">
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={selectedColor === c ? 'selected' : ''}
                          style={{ background: c }}
                          onClick={() => setSelectedColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                  {error && <p style={{ color: '#ad2c2c', fontSize: '0.85rem' }}>{error}</p>}
                  <button className="btn-primary" onClick={() => void updateProfile()}>
                    Сохранить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
