import { NavLink } from 'react-router-dom';
import './Layout.css';

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Основное меню">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Главная
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Календарь
      </NavLink>
      <NavLink to="/fridge" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Холодильник
      </NavLink>
      <NavLink to="/lists" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        Списки
      </NavLink>
      <NavLink to="/notes" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
        💬 Чат
      </NavLink>
    </nav>
  );
}
