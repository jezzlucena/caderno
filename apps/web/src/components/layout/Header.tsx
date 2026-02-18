import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useSettingsStore } from '../../stores';
import { Button } from '../ui';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { preferences, updatePreferences } = useSettingsStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

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

  const themeIcon = preferences.theme === 'dark' ? (
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
  );

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

        {/* Desktop nav — hidden on md and smaller */}
        <nav className="hidden md:flex items-center gap-8">
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
                {themeIcon}
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

        {/* Hamburger button — visible on md and smaller */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sliding drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer panel */}
          <nav className="fixed inset-y-0 right-0 w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col transition-colors">
            {/* Drawer header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400 transition-colors">
                Caderno
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isAuthenticated ? (
                <div className="flex flex-col gap-1">
                  <Link
                    to="/entries"
                    className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    {t('nav.entries')}
                  </Link>
                  <Link
                    to="/safety-timer"
                    className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    {t('nav.safetyTimer')}
                  </Link>
                  <Link
                    to="/settings"
                    className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    {t('nav.settings')}
                  </Link>

                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                    aria-label={t('settings.toggleTheme')}
                  >
                    {themeIcon}
                    <span>{t('settings.toggleTheme')}</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                  {t('auth.login')}
                </Link>
              )}
            </div>

            {/* Drawer footer — user info + logout */}
            {isAuthenticated && (
              <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-4 transition-colors">
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate transition-colors">
                  {user?.email}
                </p>
                <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={handleLogout}>
                  {t('auth.logout')}
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
