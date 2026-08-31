import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import StockBar from '../components/StockBar.jsx'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({}) // { [productId]: quantity }
  const [status, setStatus] = useState(null)
  const { token, isAuthenticated } = useAuth()

  async function refresh() {
    setProducts(await api.listProducts())
  }

  useEffect(() => {
    refresh()
  }, [])

  function addToCart(id, maxStock) {
    setCart((c) => {
      const next = (c[id] || 0) + 1
      if (next > maxStock) return c
      return { ...c, [id]: next }
    })
  }

  function removeFromCart(id) {
    setCart((c) => {
      const next = { ...c }
      if (next[id] <= 1) delete next[id]
      else next[id] -= 1
      return next
    })
  }

  const cartItems = Object.entries(cart)
  const cartTotal = cartItems.reduce((sum, [id, qty]) => {
    const p = products.find((p) => p.id === Number(id))
    return sum + (p ? p.price * qty : 0)
  }, 0)

  async function checkout() {
    setStatus(null)
    try {
      const items = cartItems.map(([product_id, quantity]) => ({
        product_id: Number(product_id),
        quantity,
      }))
      await api.createOrder(token, items)
      setCart({})
      setStatus({ type: 'ok', message: 'Order placed.' })
      refresh()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold mb-6">Products</h1>
        <div className="border border-border rounded-lg overflow-hidden bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Price</th>
                <th className="text-left px-4 py-2 font-medium">Stock</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="text-muted text-xs">{p.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <StockBar quantity={p.stock_quantity} threshold={p.low_stock_threshold} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={!isAuthenticated || p.stock_quantity <= (cart[p.id] || 0)}
                      onClick={() => addToCart(p.id, p.stock_quantity)}
                      className="text-xs px-2.5 py-1 rounded-md border border-border hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit transition-colors"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No products yet — create one from the Admin page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isAuthenticated && (
          <p className="text-muted text-sm mt-3">Log in to place an order.</p>
        )}
      </div>

      <aside className="border border-border rounded-lg bg-surface p-5 h-fit sticky top-6">
        <h2 className="font-display font-semibold mb-4">Cart</h2>
        {cartItems.length === 0 ? (
          <p className="text-muted text-sm">Cart is empty.</p>
        ) : (
          <ul className="space-y-3 mb-4">
            {cartItems.map(([id, qty]) => {
              const p = products.find((p) => p.id === Number(id))
              if (!p) return null
              return (
                <li key={id} className="flex items-center justify-between text-sm">
                  <div>
                    <div>{p.name}</div>
                    <div className="text-muted font-mono text-xs">x{qty}</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(id)}
                    className="text-muted hover:text-alert text-xs transition-colors"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <div className="border-t border-border pt-3 flex justify-between font-mono text-sm mb-4 tabular-nums">
          <span className="font-sans">Total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <button
          disabled={cartItems.length === 0}
          onClick={checkout}
          className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Place order
        </button>
        {status && (
          <p className={`text-xs mt-3 ${status.type === 'ok' ? 'text-ok' : 'text-alert'}`}>
            {status.message}
          </p>
        )}
      </aside>
    </div>
  )
}
