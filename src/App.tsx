import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CalendarPage } from './pages/CalendarPage';
import { ListsPage } from './pages/ListsPage';
import { NotesPage } from './pages/NotesPage';
import { FridgePage } from './pages/FridgePage';
import { AuthGate } from './components/AuthGate';

export default function App() {
  return (
    <Layout>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/fridge" element={<FridgePage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/notes" element={<NotesPage />} />
        </Routes>
      </AuthGate>
    </Layout>
  );
}
