import { Link } from 'react-router-dom';
import '../components/Layout.css';

export function Home() {
  return (
    <>
      <h1 className="page-title">Добро пожаловать</h1>
      <p className="page-lead">
        Домашний центр для семьи: холодильник, списки, заметки и планирование. Установите сайт на главный экран телефона, чтобы он работал как приложение.
      </p>
      <div className="grid-links">
        <Link to="/fridge">Электронный холодильник</Link>
        <Link to="/calendar">Календарь и события</Link>
        <Link to="/lists">Списки покупок и дел</Link>
        <Link to="/notes">Семейные заметки</Link>
      </div>
      <div className="card" style={{ marginTop: '1.25rem' }}>
        <h2>Как пользоваться</h2>
        <p>
          <strong>iPhone:</strong> Safari → «Поделиться» → «На экран Домой». <strong>Android:</strong> меню браузера → «Установить приложение» или
          «Добавить на главный экран».
        </p>
      </div>
      <div className="card">
        <h2>Приватность семьи</h2>
        <p>Доступ к данным только после входа. Неавторизованные пользователи не увидят ваши заметки и продукты.</p>
      </div>
    </>
  );
}
