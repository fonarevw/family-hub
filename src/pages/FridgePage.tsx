import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase, type FridgeRow } from '../lib/supabase';
import '../components/Layout.css';
import './FridgePage.css';

const categories = ['База', 'Овощи', 'Фрукты', 'Молочка', 'Мясо', 'Крупы', 'Заморозка', 'Хлеб', 'Сладкое', 'Мороженое', 'Еда собаке', 'Еда кошке', 'Другое'];
type ProductStatus = 'in' | 'buy';

export function FridgePage() {
  const [products, setProducts] = useState<FridgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductStatus | 'all'>('all');
  const [form, setForm] = useState({ name: '', quantity: 1, category: categories[0], status: 'buy' as ProductStatus });

  async function refresh() {
    if (!supabase) return;
    const { data } = await supabase.from('fridge_items').select('*').order('updated_at', { ascending: false });
    setProducts(data ?? []);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
        if (!active) return;
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p) => p.status === filter);
  }, [filter, products]);

  const inCount = products.filter((item) => item.status === 'in').length;
  const buyCount = products.filter((item) => item.status === 'buy').length;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || !supabase) return;
    await supabase.from('fridge_items').insert({
      name,
      category: form.category,
      quantity: form.quantity,
      status: form.status,
      updated_at: new Date().toISOString(),
    });
    setForm((prev) => ({ ...prev, name: '', quantity: 1 }));
    await refresh();
  }

  async function onToggle(product: FridgeRow) {
    if (!supabase) return;
    await supabase
      .from('fridge_items')
      .update({ status: product.status === 'in' ? 'buy' : 'in', updated_at: new Date().toISOString() })
      .eq('id', product.id);
    await refresh();
  }

  async function onDelete(product: FridgeRow) {
    if (!supabase) return;
    await supabase.from('fridge_items').delete().eq('id', product.id);
    await refresh();
  }

  async function onChangeQuantity(product: FridgeRow, delta: number) {
    if (!supabase) return;
    const newQty = Math.max(1, product.quantity + delta);
    await supabase.from('fridge_items').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', product.id);
    await refresh();
  }

  return (
    <>
      <h1 className="page-title">Электронный холодильник</h1>
      <p className="page-lead">Удобный семейный учёт: что есть дома и что нужно докупить.</p>

      <section className="fridge-top-grid">
        <article className="card fridge-stat-card">
          <h2>Есть дома</h2>
          <p className="fridge-stat-value">{inCount}</p>
        </article>
        <article className="card fridge-stat-card fridge-stat-card-buy">
          <h2>Нужно докупить</h2>
          <p className="fridge-stat-value">{buyCount}</p>
        </article>
      </section>

      <form className="card fridge-form" onSubmit={onSubmit}>
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Название продукта"
          autoComplete="off"
        />
        <div className="quantity-control">
          <button type="button" className="quantity-btn" onClick={() => setForm((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}>−</button>
          <span className="quantity-value">{form.quantity}</span>
          <button type="button" className="quantity-btn" onClick={() => setForm((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}>+</button>
        </div>
        <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}>
          <option value="buy">Нужно купить</option>
          <option value="in">Уже есть</option>
        </select>
        <button type="submit" className="btn-primary">Добавить</button>
      </form>

      <div className="fridge-filter">
        <button type="button" className={filter === 'all' ? 'pill active' : 'pill'} onClick={() => setFilter('all')}>Все</button>
        <button type="button" className={filter === 'in' ? 'pill active' : 'pill'} onClick={() => setFilter('in')}>Есть</button>
        <button type="button" className={filter === 'buy' ? 'pill active' : 'pill'} onClick={() => setFilter('buy')}>Купить</button>
      </div>

      <section className="fridge-list">
        {loading ? (
          <article className="card">Загрузка...</article>
        ) : filtered.length === 0 ? (
          <article className="card">Пока пусто.</article>
        ) : (
          filtered.map((product) => (
            <article key={product.id} className="card fridge-item">
              <div className="fridge-item-info">
                <p className="fridge-item-title">{product.name}</p>
                <p className="fridge-item-meta">{product.category}</p>
              </div>
              <div className="quantity-control quantity-control-sm">
                <button type="button" className="quantity-btn" onClick={() => onChangeQuantity(product, -1)}>−</button>
                <span className="quantity-value">{product.quantity}</span>
                <button type="button" className="quantity-btn" onClick={() => onChangeQuantity(product, 1)}>+</button>
              </div>
              <div className="fridge-item-actions">
                <button type="button" className="pill" onClick={() => onToggle(product)}>
                  {product.status === 'in' ? 'В список' : 'Есть'}
                </button>
                <button type="button" className="icon-btn" onClick={() => onDelete(product)}>×</button>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
