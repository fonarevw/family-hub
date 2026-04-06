import { useEffect, useState } from 'react';
import { supabase, type CalendarRow } from '../lib/supabase';
import '../components/Layout.css';

export function CalendarPage() {
  const [events, setEvents] = useState<CalendarRow[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');

  async function loadEvents() {
    if (!supabase) return;
    const { data } = await supabase.from('family_events').select('*').order('event_date', { ascending: true });
    setEvents(data ?? []);
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  return (
    <>
      <h1 className="page-title">Календарь</h1>
      <p className="page-lead">Общий семейный календарь: дни рождения, поездки, платежи и другие события.</p>

      <form
        className="card fridge-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!supabase || !title.trim() || !date) return;
          await supabase.from('family_events').insert({ title: title.trim(), event_date: date, comment: comment.trim() });
          setTitle('');
          setDate('');
          setComment('');
          await loadEvents();
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название события" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий" />
        <button type="submit" className="btn-primary">Добавить</button>
      </form>

      {events.length === 0 ? (
        <div className="card">Пока нет событий.</div>
      ) : (
        <div className="fridge-list">
          {events.map((event) => (
            <article key={event.id} className="card fridge-item">
              <div>
                <p className="fridge-item-title">{event.title}</p>
                <p className="fridge-item-meta">
                  {new Date(event.event_date).toLocaleDateString('ru-RU')}
                  {event.comment ? ` • ${event.comment}` : ''}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
