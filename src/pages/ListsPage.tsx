import { useEffect, useId, useState } from 'react';
import { supabase, type ShoppingRow } from '../lib/supabase';
import '../components/Layout.css';

export function ListsPage() {
  const inputId = useId();
  const [items, setItems] = useState<ShoppingRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    if (!supabase) return;
    const { data } = await supabase.from('shopping_items').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      await loadItems();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function add(text: string) {
    const t = text.trim();
    if (!supabase || !t) return;
    await supabase.from('shopping_items').insert({ text: t, done: false });
    await loadItems();
  }

  async function toggle(id: number, done: boolean) {
    if (!supabase) return;
    await supabase.from('shopping_items').update({ done: !done }).eq('id', id);
    await loadItems();
  }

  return (
    <>
      <h1 className="page-title">Списки</h1>
      <p className="page-lead">Общий список покупок для всей семьи. Изменения сразу видны на всех устройствах после обновления страницы.</p>

      <form
        className="card"
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const text = String(fd.get('item') ?? '');
          void add(text);
          e.currentTarget.reset();
        }}
      >
        <label htmlFor={inputId} className="visually-hidden">
          Новый пункт
        </label>
        <input
          id={inputId}
          name="item"
          type="text"
          placeholder="Молоко, хлеб…"
          autoComplete="off"
          style={{
            flex: '1 1 12rem',
            padding: '0.5rem 0.65rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            font: 'inherit',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
          }}
        >
          Добавить
        </button>
      </form>

      <ul className="list-items" style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
        {loading ? (
          <li className="card">Загрузка списка...</li>
        ) : items.length === 0 ? (
          <li className="card" style={{ color: 'var(--muted)' }}>
            Пока пусто — добавьте первый пункт выше.
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginBottom: '0.5rem',
                opacity: item.done ? 0.65 : 1,
              }}
            >
              <input type="checkbox" checked={item.done} onChange={() => void toggle(item.id, item.done)} aria-label={`Готово: ${item.text}`} />
              <span style={{ flex: 1, textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
