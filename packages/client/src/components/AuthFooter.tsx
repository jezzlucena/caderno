import { Link } from 'react-router-dom'

export function AuthFooter() {
  return (
    <footer className="mt-8 text-center text-sm text-base-content/60">
      <Link to="/about" className="link link-hover mx-2">About</Link>
      <span>·</span>
      <Link to="/terms" className="link link-hover mx-2">Terms</Link>
      <span>·</span>
      <Link to="/privacy" className="link link-hover mx-2">Privacy</Link>
      <span>·</span>
      <Link to="/support" className="link link-hover mx-2">Support</Link>
    </footer>
  )
}
