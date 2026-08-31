import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

// NOTE on localStorage: storing a JWT here is convenient for a portfolio
// project (it survives a page refresh), but it's readable by any JS that
// runs on the page, which is a real risk if the site is ever vulnerable to
// XSS. Production apps usually prefer an httpOnly cookie set by the server
// instead, which frontend JS can't read at all. Worth knowing the trade-off
// even though we're taking the simpler path here.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('if_token'))
  const [email, setEmail] = useState(() => localStorage.getItem('if_email'))

  useEffect(() => {
    if (token) localStorage.setItem('if_token', token)
    else localStorage.removeItem('if_token')
  }, [token])

  useEffect(() => {
    if (email) localStorage.setItem('if_email', email)
    else localStorage.removeItem('if_email')
  }, [email])

  function login(newToken, newEmail) {
    setToken(newToken)
    setEmail(newEmail)
  }

  function logout() {
    setToken(null)
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ token, email, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
