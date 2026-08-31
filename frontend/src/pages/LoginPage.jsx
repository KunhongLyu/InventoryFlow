import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const { access_token } = await api.login(email, password)
      login(access_token, email)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-6">
      <h1 className="font-display text-2xl font-bold mb-6">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-muted mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {error && <p className="text-alert text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-accent text-white rounded-md py-2 font-medium hover:opacity-90 transition-opacity"
        >
          Log in
        </button>
      </form>
      <p className="text-sm text-muted mt-4">
        No account?{' '}
        <Link to="/register" className="text-accent">
          Register
        </Link>
      </p>
    </div>
  )
}
