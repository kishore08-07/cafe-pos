import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="text-text-muted hover:text-gold transition-colors p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
