import type { Trade, SetupType } from '../../types/trade'
import { SETUP_OPTIONS } from '../../types/trade'

interface SetupTrendSparklineProps {
  trades: Trade[]
  setup: SetupType
  windowSize?: number
}

export function SetupTrendSparkline({ trades, setup, windowSize = 20 }: SetupTrendSparklineProps) {
  // Get trades for this setup, most recent first
  const setupTrades = trades
    .filter(t => t.setup.includes(setup))
    .slice(0, windowSize)
    .reverse() // Oldest to newest for the chart

  if (setupTrades.length < 3) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{setup}:</span>
        <span className="text-xs">Need more data</span>
      </div>
    )
  }

  // Calculate running win rate
  const dataPoints = setupTrades.map((_, idx) => {
    const window = setupTrades.slice(0, idx + 1)
    const wins = window.filter(t => t.result === 'Win').length
    return (wins / window.length) * 100
  })

  const minRate = Math.min(...dataPoints, 30)
  const maxRate = Math.max(...dataPoints, 70)
  const range = maxRate - minRate || 1

  // SVG dimensions
  const width = 60
  const height = 24
  const padding = 2

  // Generate path
  const points = dataPoints.map((rate, idx) => {
    const x = padding + (idx / (dataPoints.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((rate - minRate) / range) * (height - 2 * padding)
    return `${x},${y}`
  })

  const pathD = `M ${points.join(' L ')}`

  // Current trend
  const recent = dataPoints.slice(-5)
  const older = dataPoints.slice(0, 5)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  const trend = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'flat'
  const trendColor = trend === 'up' ? 'var(--profit)' : trend === 'down' ? 'var(--loss)' : 'var(--neutral)'

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 truncate" style={{ color: 'var(--text-secondary)' }}>{setup}</span>
      
      {/* Sparkline */}
      <svg width={width} height={height} className="flex-none">
        <path
          d={pathD}
          fill="none"
          stroke={trendColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="2"
          fill={trendColor}
        />
      </svg>
      
      {/* Stats */}
      <div className="flex items-center gap-2 text-xs">
        <span style={{ color: trendColor }}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          {dataPoints[dataPoints.length - 1].toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// Multi-setup sparkline view
interface SetupTrendsProps {
  trades: Trade[]
}

export function SetupTrends({ trades }: SetupTrendsProps) {
  const activeSetups = SETUP_OPTIONS.filter(setup => 
    trades.some(t => t.setup.includes(setup))
  )

  if (activeSetups.length === 0) {
    return (
      <div className="phone-card p-4">
        <p className="text-xs font-semibold mb-2 gold-text">Setup Trends</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data yet</p>
      </div>
    )
  }

  return (
    <div className="phone-card p-4">
      <p className="text-xs font-semibold mb-3 gold-text">Setup Trends (20 trades)</p>
      <div className="space-y-2">
        {activeSetups.map(setup => (
          <SetupTrendSparkline key={setup} trades={trades} setup={setup} />
        ))}
      </div>
    </div>
  )
}
