import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import StockBar from '../components/StockBar.jsx'

const EMPTY_FORM = { name: '', description: '', price: '', stock_quantity: '', low_stock_threshold: 5 }

export default function AdminPage() {
  const { token } = useAuth()
  const [lowStock, setLowStock] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState(null)

  async function refreshLowStock() {
    try {
      setLowStock(await api.lowStock(token))
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  useEffect(() => {
    refreshLowStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus(null)
    try {
      await api.createProduct(token, {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity, 10),
        low_stock_threshold: parseInt(form.low_stock_threshold, 10),
      })
      setStatus({ type: 'ok', message: `Created "${form.name}".` })
      setForm(EMPTY_FORM)
      refreshLowStock()
    } catch (err) {
      // A 403 here almost always means this account isn't an admin yet —
      // see the README for how the first admin gets bootstrapped.
      setStatus({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div>
        <h1 className="font-display text-xl font-bold mb-6">Add product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-border rounded-md px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-border rounded-md px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              required
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border border-border rounded-md px-3 py-2 bg-surface font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              required
              type="number"
              placeholder="Stock"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              className="border border-border rounded-md px-3 py-2 bg-surface font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              required
              type="number"
              placeholder="Low stock at"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
              className="border border-border rounded-md px-3 py-2 bg-surface font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            type="submit"
            className="bg-accent text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create product
          </button>
          {status && (
            <p className={`text-sm ${status.type === 'ok' ? 'text-ok' : 'text-alert'}`}>
              {status.message}
            </p>
          )}
        </form>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold mb-6">Low stock</h2>
        {lowStock.length === 0 ? (
          <p className="text-muted text-sm">Nothing below threshold.</p>
        ) : (
          <ul className="space-y-3">
            {lowStock.map((p) => (
              <li
                key={p.id}
                className="border border-border rounded-lg bg-surface p-3 flex items-center justify-between"
              >
                <span className="text-sm">{p.name}</span>
                <StockBar quantity={p.stock_quantity} threshold={p.low_stock_threshold} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
