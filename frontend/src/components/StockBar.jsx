export default function StockBar({ quantity, threshold }) {
  const low = quantity <= threshold
  const scale = Math.max(quantity, threshold * 3, 10)
  const pct = Math.min(100, (quantity / scale) * 100)

  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${low ? 'bg-alert' : 'bg-ok'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-xs tabular-nums ${low ? 'text-alert' : 'text-muted'}`}>
        {quantity}
      </span>
    </div>
  )
}
