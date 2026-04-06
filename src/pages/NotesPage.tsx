import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../components/Layout.css';

export function NotesPage() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Загрузка заметок...');

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('family_notes').select('*').eq('id', 1).maybeSingle();
      if (!active) return;
      setText(data?.content ?? '');
      setStatus('Все изменения сохраняются в общей базе.');
    })();
    return () => {
      active = false;
    };
  }, []);

  async function save(next: string) {
    setText(next);
    if (!supabase) return;
    await supabase.from('family_notes').upsert({ id: 1, content: next, updated_at: new Date().toISOString() });
  }

  return (
    <>
      <h1 className="page-title">Заметки</h1>
      <p className="page-lead">Общий семейный блокнот. Видно только авторизованным членам семьи.</p>
      <div className="card" style={{ padding: 0 }}>
        <label htmlFor="family-notes" className="visually-hidden">
          Текст заметок
        </label>
        <textarea
          id="family-notes"
          value={text}
          onChange={(e) => void save(e.target.value)}
          placeholder="Напишите что угодно для семьи…"
          style={{
            width: '100%',
            minHeight: '220px',
            padding: '1rem',
            border: 'none',
            borderRadius: 'var(--radius)',
            font: 'inherit',
            lineHeight: 1.45,
            resize: 'vertical',
            background: 'transparent',
          }}
        />
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.75rem' }}>{status}</p>
    </>
  );
}
