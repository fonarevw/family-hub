import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
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

const emojis = ['😀', '😎', '🤗', '🥰', '😇', '🤠', '🧑‍💻', '👨‍🍳', '👩‍🎨', '🧑‍🚀', '🦊', '🐱', '🐶', '🦁', '🐼', '🐸', '🦄', '🐰', '🐻', '🦋'];
const colors = ['#1d7a57', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(emojis[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        void loadAccount(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        void loadAccount(nextSession.user.id);
      } else {
        setAccount(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadAccount(userId: string) {
    if (!supabase) return;
    const { data } = await supabase.from('family_accounts').select('*').eq('user_id', userId).single();
    if (data) {
      setAccount(data as Account);
    } else {
      setShowSetup(true);
    }
    setLoading(false);
  }

  async function signIn() {
    if (!supabase) return;
    setError('');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      setError(signInError.message);
    }
  }

  async function setupAccount() {
    if (!supabase || !session?.user) return;
    setError('');
    
    const { error: insertError } = await supabase.from('family_accounts').insert({
      user_id: session.user.id,
      name: name.trim() || email.split('@')[0],
      birthday: birthday || null,
      avatar_emoji: selectedEmoji,
      avatar_color: selectedColor,
      avatar_url: null,
    });
    
    if (insertError) {
      setError(insertError.message);
      return;
    }
    
    await loadAccount(session.user.id);
    setShowSetup(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (!supabase) {
    return (
      <section className="card">
        <h2>Ошибка</h2>
        <p>Supabase не настроен. Добавьте переменные окружения.</p>
      </section>
    );
  }

  if (loading) {
    return <section className="card">Загрузка...</section>;
  }

  if (!session) {
    return (
      <section className="card">
        <h2>👨‍👩‍👧‍👦 Семейный хаб</h2>
        <p className="page-lead">Приватное пространство для вашей семьи.</p>
        
        {!showLogin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-primary" onClick={() => setShowLogin(true)}>
              Войти
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
              Нет аккаунта? Попросите администратора добавить вас или напишите в Telegram @fonarevw 😉
            </p>
          </div>
        ) : (
          <div className="account-form">
            <h3>Вход</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              onKeyDown={(e) => e.key === 'Enter' && void signIn()}
            />
            {error && <p style={{ color: '#ad2c2c' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button className="pill" onClick={() => setShowLogin(false)}>Назад</button>
              <button className="btn-primary" onClick={() => void signIn()} style={{ flex: 1 }}>Войти</button>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (showSetup) {
    return (
      <section className="card">
        <h2>👤 Создайте профиль</h2>
        <p className="page-lead">Расскажите о себе</p>
        
        <div className="account-form" style={{ marginTop: '1rem' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
          />
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          <div className="avatar-picker">
            <p>Аватарка:</p>
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="preview-avatar" style={{ background: selectedColor }}>
              <span style={{ fontSize: '2rem' }}>{selectedEmoji}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{name || 'Имя'}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                {birthday ? new Date(birthday).toLocaleDateString('ru') : 'День рождения не указан'}
              </p>
            </div>
          </div>
          {error && <p style={{ color: '#ad2c2c' }}>{error}</p>}
          <button className="btn-primary" onClick={() => void setupAccount()} style={{ marginTop: '0.5rem' }}>
            Сохранить
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="auth-line">
        <div className="auth-user">
          <div className="auth-avatar" style={{ background: account?.avatar_color }}>
            {account?.avatar_url 
              ? <img src={account.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> 
              : account?.avatar_emoji}
          </div>
          <div>
            <span className="auth-name">{account?.name}</span>
            <span className="auth-birthday">{account?.birthday ? new Date(account.birthday).toLocaleDateString('ru') : ''}</span>
          </div>
        </div>
        <button className="pill" onClick={() => void signOut()}>Выйти</button>
      </div>
      {children}
    </>
  );
}
