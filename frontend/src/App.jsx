import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { useAuth } from './context/AuthContext.jsx'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  )
}
