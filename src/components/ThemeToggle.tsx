import React from 'react';
import { useTheme } from './theme-provider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useLanguage } from '../state/language';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const themeLabel = theme === 'light' ? t('themeLight') : theme === 'dark' ? t('themeDark') : t('themeAuto');

  const toggleSingle = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      // If currently on system, toggle to light or dark based on system preference
      const isSystemDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isSystemDark ? 'light' : 'dark');
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Mobile Single-Button Toggle (Cycle light/dark) */}
      <button
        type="button"
        onClick={toggleSingle}
        className="sm:hidden p-1.5 sm:p-2 rounded-xl bg-muted/60 dark:bg-slate-900 border border-border text-foreground hover:border-amber-500/50 hover:bg-muted transition cursor-pointer flex items-center justify-center shadow-xs"
        title={`${t('toggleTheme')} (${t('currentTheme')}: ${themeLabel})`}
        aria-label={`${t('toggleTheme')} (${t('currentTheme')}: ${themeLabel})`}
      >
        {theme === 'light' ? (
          <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-200" />
        ) : theme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200" />
        ) : (
          <Monitor className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200" />
        )}
      </button>

      {/* Tablet & Desktop Segmented 3-Way Control (Light / Dark / Auto) */}
      <div
        role="group"
        aria-label={t('themeSelection')}
        className="hidden sm:inline-flex items-center bg-muted/60 dark:bg-slate-900 p-0.5 rounded-xl border border-border text-[11px] sm:text-xs shadow-xs"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-medium ${
            theme === 'light'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
          title={t('themeLight')}
          aria-label={t('themeLight')}
        >
          <Sun className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline text-[11px]">{t('themeLight')}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-medium ${
            theme === 'dark'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
          title={`${t('themeDark')} (D)`}
          aria-label={t('themeDark')}
        >
          <Moon className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline text-[11px]">{t('themeDark')}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          aria-pressed={theme === 'system'}
          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-medium ${
            theme === 'system'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
          title={t('themeAuto')}
          aria-label={t('themeAuto')}
        >
          <Monitor className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline text-[11px]">{t('themeAuto')}</span>
        </button>
      </div>
    </div>
  );
};
