import type { Trade } from '../../types/trade'

interface RMHistogramProps {
  trades: Trade[]
  maxR?: number
}

const R_BUCKETS = [-2, -1, 0, 1, 2, 3, 4, 5]

export function RMHistogram({ trades, maxR = 5 }: RMHistogramProps) {
  // Calculate distribution
  const distribution = R_BUCKETS.map(bucket => {
    const count = trades.filter(t => {
      const r = t.rMultiple
      if (bucket === -2) return r <= -2
      if (bucket === 5) return r >= 4
      return r >= bucket && r < bucket + 1
    }).length
    return { bucket, count, label: bucket === 5 ? '4R+' : `${bucket}R` }
  })

  const maxCount = Math.max(...distribution.map(d => d.count), 1)

  return (
    <div className="phone-card p-4">
      <p className="text-xs font-semibold mb-3 gold-text">R-Multiple Distribution</p>
      <div className="flex items-end justify-between gap-1 h-32">
        {distribution.map(({ bucket, count, label }) => {
          const height = count > 0 ? (count / maxCount) * 100 : 0
          const isPositive = bucket >= 1
          const isNeutral = bucket === 0
          const color = isPositive ? 'var(--profit)' : isNeutral ? 'var(--neutral)' : 'var(--loss)'
          
          return (
            <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {count}
              </span>
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${height}%`,
                  background: color,
                  minHeight: count > 0 ? '4px' : '0',
                  opacity: count > 0 ? 1 : 0.3
                }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
