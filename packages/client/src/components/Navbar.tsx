import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightStartOnRectangleIcon, ArrowLeftEndOnRectangleIcon, LockClosedIcon, Bars3Icon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { usePlatformStore } from '../stores/platformStore'
import { NotificationBell } from './NotificationBell'
import logoUrl from '../assets/logo.svg'

type Page = 'journal' | 'feed' | 'switches' | 'settings' | 'platform' | 'about' | 'terms' | 'privacy' | 'support' | 'compare' | 'notifications' | 'export' | 'import'

interface NavbarProps {
  currentPage: Page
}

export function Navbar({ currentPage }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const { toggleSidebar, isSidebarOpen } = useUIStore()
  const { displayName, fetchSettings } = usePlatformStore()

  const isAuthenticated = !!user

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // App navigation links (only shown when authenticated)
  const appNavLinks: { to: string; label: string; page: Page }[] = [
    { to: '/', label: 'Journal', page: 'journal' },
    { to: '/feed', label: 'Feed', page: 'feed' },
    { to: '/switches', label: 'Switches', page: 'switches' },
    { to: '/export', label: 'Export', page: 'export' },
    { to: '/import', label: 'Import', page: 'import' },
    { to: '/settings', label: 'Account', page: 'settings' },
    // Platform link only visible to admins/moderators
    ...(user?.role === 'admin' || user?.role === 'moderator'
      ? [{ to: '/platform', label: 'Platform', page: 'platform' as Page }]
      : [])
  ]

  return (
    <div className="navbar bg-base-100 shadow-lg px-2 sm:px-4 z-40">
      {/* Sidebar toggle for Dashboard */}
      {currentPage === 'journal' && (
        <div className="fixed bottom-0 left-0 flex-none lg:hidden">
          <button
            className="btn btn-square btn-ghost"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <ArrowLeftEndOnRectangleIcon className="w-5 h-5" /> : <ArrowRightStartOnRectangleIcon className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Logo/Title */}
      <div className="flex-1">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold px-2 sm:px-4">
          <img src={logoUrl} alt={`${displayName} logo`} className="h-10 w-10" />
          <span className="inline leading-none">{displayName}</span>
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Username (only when authenticated) */}
        {isAuthenticated && user?.username && (
          <Link to={`/${user.username}`} className="text-sm hidden md:inline link link-hover">
            @{user.username}
          </Link>
        )}

        {/* Notifications bell (only when authenticated) */}
        {isAuthenticated && <NotificationBell />}

        {/* Settings link (only when authenticated) */}
        {isAuthenticated && (
          <Link
            to="/settings"
            className={`btn btn-ghost btn-sm btn-circle hidden sm:flex ${currentPage === 'settings' ? 'btn-active' : ''}`}
            aria-label="Account Settings"
          >
            <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
        )}

        {/* Email verification badge (only when authenticated) */}
        {isAuthenticated && !user?.emailVerified && (
          <span className="badge badge-warning badge-sm hidden sm:flex">Unverified</span>
        )}

        {/* E2EE badge (only when authenticated) */}
        {isAuthenticated && (
          <div className="badge badge-success badge-sm gap-1 flex" aria-label="End-to-End Encryption enabled">
            <LockClosedIcon className="h-3 w-3" aria-hidden="true" />
            <span aria-hidden="true">E2EE</span>
          </div>
        )}

        {/* Mobile dropdown menu */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Navigation menu"
            aria-haspopup="true"
          >
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          </button>
          <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-52" role="menu">
            {isAuthenticated ? (
              <>
                {appNavLinks.map(link => (
                  <li key={link.to} role="none"><Link to={link.to} role="menuitem" className={currentPage === link.page ? 'underline' : ''}>{link.label}</Link></li>
                ))}
                {user?.username && (
                  <li role="none"><Link to={`/${user.username}`} role="menuitem" className="text-xs opacity-70">@{user.username}</Link></li>
                )}
                <li role="none"><button role="menuitem" onClick={logout}>Logout</button></li>
              </>
            ) : (
              <>
                <li role="none"><Link to="/login" role="menuitem">Login</Link></li>
                <li role="none"><Link to="/register" role="menuitem">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
