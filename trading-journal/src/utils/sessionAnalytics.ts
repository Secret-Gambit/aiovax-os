import type { Trade } from '../types/trade'

export type TradingSession = 'Asian' | 'London' | 'New York' | 'Pre-Market'

export interface SessionStats {
  session: TradingSession
  totalTrades: number
  wins: number
  losses: number
  breakevens: number
  winRate: number
  netR: number
  avgR: number
  bestTrade: number
  worstTrade: number
  avgWinR: number
  avgLossR: number
  profitFactor: number
}

// Convert HH:MM time to hour number (0-23)
export function parseTimeToHour(time: string): number {
  const [hours] = time.split(':').map(Number)
  return hours
}

// Determine trading session from hour (UTC times)
export function getSessionFromHour(hour: number): TradingSession {
  // Asian: 00:00 - 09:00 UTC (Tokyo/Sydney)
  if (hour >= 0 && hour < 9) {
    return 'Asian'
  }
  // London: 08:00 - 17:00 UTC (includes overlap)
  if (hour >= 8 && hour < 17) {
    return 'London'
  }
  // New York: 13:00 - 22:00 UTC (includes overlap)
  if (hour >= 13 && hour < 22) {
    return 'New York'
  }
  // Pre-Market: 22:00 - 00:00 UTC
  return 'Pre-Market'
}

// Get session from trade entry time
export function getSessionFromTrade(trade: Trade): TradingSession | null {
  if (!trade.entryTime) return null
  const hour = parseTimeToHour(trade.entryTime)
  return getSessionFromHour(hour)
}

// Get session display info
export function getSessionInfo(session: TradingSession): {
  label: string
  timeRange: string
  color: string
  icon: string
} {
  switch (session) {
    case 'Asian':
      return {
        label: 'Asian Session',
        timeRange: '00:00 - 09:00 UTC',
        color: '#22c55e', // Green
        icon: '🌅'
      }
    case 'London':
      return {
        label: 'London Session',
        timeRange: '08:00 - 17:00 UTC',
        color: '#3b82f6', // Blue
        icon: '🏰'
      }
    case 'New York':
      return {
        label: 'New York Session',
        timeRange: '13:00 - 22:00 UTC',
        color: '#f59e0b', // Orange
        icon: '🗽'
      }
    case 'Pre-Market':
      return {
        label: 'Pre-Market',
        timeRange: '22:00 - 00:00 UTC',
        color: '#6b7280', // Gray
        icon: '🌙'
      }
  }
}

// Calculate stats for each trading session
export function calculateSessionStats(trades: Trade[]): SessionStats[] {
  const sessionMap = new Map<TradingSession, {
    trades: Trade[]
    wins: number
    losses: number
    breakevens: number
    netR: number
    totalWinR: number
    totalLossR: number
    bestTrade: number
    worstTrade: number
  }>()

  // Initialize all sessions
  const allSessions: TradingSession[] = ['Asian', 'London', 'New York', 'Pre-Market']
  allSessions.forEach(session => {
    sessionMap.set(session, {
      trades: [],
      wins: 0,
      losses: 0,
      breakevens: 0,
      netR: 0,
      totalWinR: 0,
      totalLossR: 0,
      bestTrade: -Infinity,
      worstTrade: Infinity
    })
  })

  // Process each trade with entry time
  trades.forEach(trade => {
    const session = getSessionFromTrade(trade)
    if (!session) return

    const stats = sessionMap.get(session)!
    stats.trades.push(trade)

    if (trade.result === 'Win') {
      stats.wins++
      stats.totalWinR += trade.rMultiple
      stats.bestTrade = Math.max(stats.bestTrade, trade.rMultiple)
    } else if (trade.result === 'Loss') {
      stats.losses++
      stats.totalLossR += Math.abs(trade.rMultiple)
      stats.worstTrade = Math.min(stats.worstTrade, -Math.abs(trade.rMultiple))
    } else {
      stats.breakevens++
    }

    // Update net R
    if (trade.result === 'Win') {
      stats.netR += trade.rMultiple
    } else if (trade.result === 'Loss') {
      stats.netR -= Math.abs(trade.rMultiple)
    }
  })

  // Calculate derived stats
  return allSessions.map(session => {
    const data = sessionMap.get(session)!
    const totalTrades = data.wins + data.losses + data.breakevens
    const winRate = totalTrades > 0 ? (data.wins / totalTrades) * 100 : 0
    const avgR = totalTrades > 0 ? data.netR / totalTrades : 0
    const avgWinR = data.wins > 0 ? data.totalWinR / data.wins : 0
    const avgLossR = data.losses > 0 ? data.totalLossR / data.losses : 0
    const profitFactor = data.totalLossR > 0 
      ? data.totalWinR / data.totalLossR 
      : data.totalWinR > 0 ? Infinity : 0

    return {
      session,
      totalTrades,
      wins: data.wins,
      losses: data.losses,
      breakevens: data.breakevens,
      winRate,
      netR: data.netR,
      avgR,
      bestTrade: data.bestTrade === -Infinity ? 0 : data.bestTrade,
      worstTrade: data.worstTrade === Infinity ? 0 : data.worstTrade,
      avgWinR,
      avgLossR,
      profitFactor
    }
  })
}

// Get best performing session
export function getBestSession(stats: SessionStats[]): SessionStats | null {
  const validSessions = stats.filter(s => s.totalTrades >= 5) // Min 5 trades
  if (validSessions.length === 0) return null
  return validSessions.reduce((best, current) => 
    current.netR > best.netR ? current : best
  )
}

// Get worst performing session
export function getWorstSession(stats: SessionStats[]): SessionStats | null {
  const validSessions = stats.filter(s => s.totalTrades >= 5)
  if (validSessions.length === 0) return null
  return validSessions.reduce((worst, current) => 
    current.netR < worst.netR ? current : worst
  )
}

// Get highest win rate session
export function getBestWinRateSession(stats: SessionStats[]): SessionStats | null {
  const validSessions = stats.filter(s => s.totalTrades >= 5)
  if (validSessions.length === 0) return null
  return validSessions.reduce((best, current) => 
    current.winRate > best.winRate ? current : best
  )
}

// Calculate hourly performance (for time-of-day heatmap)
export interface HourlyPerformance {
  hour: number
  label: string
  trades: number
  winRate: number
  netR: number
  avgR: number
}

export function calculateHourlyPerformance(trades: Trade[]): HourlyPerformance[] {
  const hourlyMap = new Map<number, {
    trades: number
    wins: number
    netR: number
  }>()

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { trades: 0, wins: 0, netR: 0 })
  }

  trades.forEach(trade => {
    if (!trade.entryTime) return
    const hour = parseTimeToHour(trade.entryTime)
    const stats = hourlyMap.get(hour)!
    
    stats.trades++
    if (trade.result === 'Win') {
      stats.wins++
      stats.netR += trade.rMultiple
    } else if (trade.result === 'Loss') {
      stats.netR -= Math.abs(trade.rMultiple)
    }
  })

  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    trades: data.trades,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    netR: data.netR,
    avgR: data.trades > 0 ? data.netR / data.trades : 0
  }))
}
