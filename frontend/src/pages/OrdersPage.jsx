import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const { token } = useAuth()

  useEffect(() => {
    api.myOrders(token).then(setOrders)
  }, [token])

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="border border-border rounded-lg bg-surface p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-mono text-muted">Order #{o.id}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    o.status === 'paid' ? 'bg-ok/10 text-ok' : 'bg-canvas text-muted'
                  }`}
                >
                  {o.status}
                </span>
              </div>
              <ul className="text-sm text-muted mb-2 space-y-0.5">
                {o.items.map((it, i) => (
                  <li key={i} className="font-mono">
                    #{it.product_id} × {it.quantity} — ${(it.unit_price * it.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
              <div className="font-mono text-sm font-medium tabular-nums">
                ${o.total_amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
