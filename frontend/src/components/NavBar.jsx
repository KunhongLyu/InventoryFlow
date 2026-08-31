import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function NavBar() {
  const { isAuthenticated, email, logout } = useAuth()

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm rounded-md transition-colors ${
      isActive ? 'bg-ink text-white' : 'text-muted hover:text-ink'
    }`

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-lg tracking-tight">
          Inventory<span className="text-accent">Flow</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Products
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {isAuthenticated ? (
            <>
              <span className="text-muted font-mono text-xs">{email}</span>
              <button onClick={logout} className="text-muted hover:text-ink">
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded-md bg-accent text-white text-sm">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
