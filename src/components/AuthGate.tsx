import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isCloudConfigured, supabase } from '../lib/supabase';
import './Layout.css';

type Props = { children: ReactNode };

export function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isCloudConfigured) {
    return (
      <section className="card">
        <h2>Нужно подключить облачную БД</h2>
        <p>
          Добавьте переменные <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> в Netlify и в локальный <code>.env</code>.
          После этого все данные станут общими для семьи.
        </p>
      </section>
    );
  }

  if (loading) {
    return <section className="card">Проверяем доступ...</section>;
  }

  if (!session) {
    return (
      <section className="card">
        <h2>Вход для семьи</h2>
        <p className="page-lead">Только авторизованные члены семьи видят холодильник, заметки и календарь.</p>
        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            if (!supabase) return;
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) setError(signInError.message);
          }}
        >
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Пароль" />
          <button type="submit" className="btn-primary">
            Войти
          </button>
        </form>
        {error ? <p style={{ color: '#ad2c2c', marginTop: '0.75rem' }}>{error}</p> : null}
      </section>
    );
  }

  return (
    <>
      <div className="auth-line">
        <span>Вход: {session.user.email}</span>
        <button
          className="pill"
          type="button"
          onClick={async () => {
            if (!supabase) return;
            await supabase.auth.signOut();
          }}
        >
          Выйти
        </button>
      </div>
      {children}
    </>
  );
}
