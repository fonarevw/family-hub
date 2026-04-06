import type { ReactNode } from 'react';
import { AppNav } from './AppNav';
import { ProfileButton } from './ProfileButton';
import './Layout.css';

type Props = { children: ReactNode };

export function Layout({ children }: Props) {
  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-brand">
          <span className="layout-title">Семья</span>
          <span className="layout-domain">fonarevtd.ru</span>
        </div>
        <div className="layout-nav-row">
          <AppNav />
          <ProfileButton />
        </div>
      </header>
      <main className="layout-main">{children}</main>
      <footer className="layout-footer">
        <p className="layout-footer-text">Семейный хаб: доступ только после входа, данные хранятся в общей облачной базе.</p>
      </footer>
    </div>
  );
}
