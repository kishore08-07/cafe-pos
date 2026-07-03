import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { useThemeStore, applyThemeToDocument } from './store/themeStore';
import { ToastContainer } from './components/ui/Toast';
import { useAuthStore } from './store/authStore';
import { useCatalogStore } from './store/catalogStore';
import { useSessionStore } from './store/sessionStore';

function App() {
  const theme = useThemeStore((s) => s.theme);
  const token = useAuthStore((s) => s.token);
  const hydrate = useCatalogStore((s) => s.hydrate);
  const hydrateSession = useSessionStore((s) => s.hydrateSession);
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (!token) return;
    void Promise.all([hydrate(), hydrateSession()]).catch(() => undefined);
  }, [token, hydrate, hydrateSession]);

  return (
    <BrowserRouter>
      <AppRouter />
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
