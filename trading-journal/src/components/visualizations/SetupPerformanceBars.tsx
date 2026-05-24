import type { Trade, SetupType } from '../../types/trade'
import { SETUP_OPTIONS } from '../../types/trade'

interface SetupPerformanceBarsProps {
  trades: Trade[]
}

export function SetupPerformanceBars({ trades }: SetupPerformanceBarsProps) {
  // Calculate stats per setup
  const setupStats = SETUP_OPTIONS.map(setup => {
    const setupTrades = trades.filter(t => t.setup.includes(setup))
    const wins = setupTrades.filter(t => t.result === 'Win').length
    const total = setupTrades.length
    const winRate = total > 0 ? (wins / total) * 100 : 0
    const netR = setupTrades.reduce((sum, t) => {
      if (t.result === 'Win') return sum + t.rMultiple
      if (t.result === 'Loss') return sum - Math.abs(t.rMultiple)
      return sum
    }, 0)
    return { setup, total, winRate, netR }
  }).filter(s => s.total > 0)
    .sort((a, b) => b.winRate - a.winRate)

  if (setupStats.length === 0) {
    return (
      <div className="phone-card p-4">
        <p className="text-xs font-semibold mb-2 gold-text">Setup Performance</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data yet</p>
      </div>
    )
  }

  const maxWinRate = Math.max(...setupStats.map(s => s.winRate), 100)

  return (
    <div className="phone-card p-4">
      <p className="text-xs font-semibold mb-3 gold-text">Setup Performance</p>
      <div className="space-y-3">
        {setupStats.map(({ setup, total, winRate, netR }) => {
          const barWidth = (winRate / maxWinRate) * 100
          const isProfitable = netR > 0
          
          return (
            <div key={setup}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{setup}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {winRate.toFixed(0)}% ({total} trades)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      background: isProfitable ? 'var(--profit)' : 'var(--loss)'
                    }}
                  />
                </div>
                <span 
                  className="text-xs font-medium w-12 text-right"
                  style={{ color: isProfitable ? 'var(--profit)' : 'var(--loss)' }}
                >
                  {netR >= 0 ? '+' : ''}{netR.toFixed(1)}R
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
