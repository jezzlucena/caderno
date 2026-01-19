import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useSettingsStore } from '../../stores';
import { Button } from '../ui';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { preferences, updatePreferences } = useSettingsStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    let newTheme: 'system' | 'light' | 'dark';

    if (preferences.theme === 'system' && typeof window !== 'undefined') {
      newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    } else {
      newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    }

    updatePreferences({ theme: newTheme });
  };

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400 transition-colors"
        >
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          Caderno
        </Link>

        <nav className="flex items-center gap-8">
          {isAuthenticated ? (
            <>
              <Link
                to="/entries"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
              >
                {t('nav.entries')}
              </Link>
              <Link
                to="/safety-timer"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
              >
                {t('nav.safetyTimer')}
              </Link>
              <Link
                to="/settings"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
              >
                {t('nav.settings')}
              </Link>

              <button
                onClick={toggleTheme}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                aria-label={t('settings.toggleTheme')}
              >
                {preferences.theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                  {user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  {t('auth.logout')}
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm">
                {t('auth.login')}
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
