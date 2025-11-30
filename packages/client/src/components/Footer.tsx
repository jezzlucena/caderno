import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="footer footer-center p-6 bg-base-200 text-base-content mt-auto">
      <div className="flex flex-col items-center gap-4">
        {/* Main footer content */}
        <nav className="flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/about" className="link link-hover">About</Link>
          <Link to="/terms" className="link link-hover">Terms</Link>
          <Link to="/privacy" className="link link-hover">Privacy</Link>
          <Link to="/support" className="link link-hover">Support</Link>
        </nav>

        {/* Powered by Caderno disclaimer */}
        <div className="flex flex-row items-center gap-1 pt-2 border-t border-base-300 w-full max-w-md">
          <div className="text-xs text-base-content/50">
            Powered by{' '}
            <a
              href="https://github.com/jezzlucena/caderno"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover"
            >
              Caderno
            </a>
          </div>
          <div className="text-xs text-base-content/50">
            {"|"}
          </div>
          <div className="flex items-center gap-1 text-xs text-base-content/40">
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              Creative Commons - Some Rights Reserved
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
