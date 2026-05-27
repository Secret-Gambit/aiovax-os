import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Trade } from '../types/trade'
import { calculateSessionStats, calculateHourlyPerformance, type SessionStats, type HourlyPerformance } from '../utils/sessionAnalytics'

const STORAGE_KEY = 'xauusd-trades'

export interface DisciplineAlert {
  type: 'overtrading' | 'revenge' | 'stop-signal' | 'emotional'
  message: string
  severity: 'warning' | 'danger'
}

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Trade[]
        // Backward compatibility: ensure all trades have an instrument field
        const migrated = parsed.map(trade => ({
          ...trade,
          instrument: trade.instrument || 'XAUUSD', // Default to XAUUSD for existing trades
        }))
        setTrades(migrated)
      } catch (e) {
        console.error('Failed to parse trades:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades))
    }
  }, [trades, isLoaded])

  const addTrade = useCallback((trade: Omit<Trade, 'id' | 'timestamp'>) => {
    const newTrade: Trade = {
      ...trade,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }
    setTrades(prev => [newTrade, ...prev])
    return newTrade
  }, [])

  const deleteTrade = useCallback((id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateTrade = useCallback((id: string, updates: Partial<Omit<Trade, 'id' | 'timestamp'>>) => {
    setTrades(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ))
  }, [])

  const todayTrades = useMemo(() => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    return trades.filter(t => t.timestamp >= startOfDay)
  }, [trades])

  const allTimeTrades = useMemo(() => trades, [trades])

  const stats = useMemo(() => {
    const all = allTimeTrades
    const today = todayTrades
    
    const wins = today.filter(t => t.result === 'Win').length
    const losses = today.filter(t => t.result === 'Loss').length
    const breakevens = today.filter(t => t.result === 'Breakeven').length
    
    const netR = today.reduce((sum, t) => {
      if (t.result === 'Win') return sum + t.rMultiple
      if (t.result === 'Loss') return sum - Math.abs(t.rMultiple)
      return sum
    }, 0)

    const calculateStreak = () => {
      let currentStreak = 0
      let streakType: 'win' | 'loss' | null = null
      
      for (const trade of today) {
        if (trade.result === 'Win') {
          if (streakType === null) {
            streakType = 'win'
            currentStreak = 1
          } else if (streakType === 'win') {
            currentStreak++
          } else {
            break
          }
        } else if (trade.result === 'Loss') {
          if (streakType === null) {
            streakType = 'loss'
            currentStreak = -1
          } else if (streakType === 'loss') {
            currentStreak--
          } else {
            break
          }
        }
      }
      
      return { streak: currentStreak, type: streakType }
    }

    const streakData = calculateStreak()

    const totalTrades = all.length
    const totalWins = all.filter(t => t.result === 'Win').length
    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0
    
    const allNetR = all.reduce((sum, t) => {
      if (t.result === 'Win') return sum + t.rMultiple
      if (t.result === 'Loss') return sum - Math.abs(t.rMultiple)
      return sum
    }, 0)
    
    const avgR = totalTrades > 0 ? allNetR / totalTrades : 0

    const setupStats = new Map<string, { trades: number; netR: number }>()
    all.forEach(t => {
      t.setup.forEach(s => {
        const current = setupStats.get(s) || { trades: 0, netR: 0 }
        current.trades++
        if (t.result === 'Win') current.netR += t.rMultiple
        else if (t.result === 'Loss') current.netR -= Math.abs(t.rMultiple)
        setupStats.set(s, current)
      })
    })
    
    let bestSetup: string | null = null
    let worstSetup: string | null = null
    let bestR = -Infinity
    let worstR = Infinity
    
    setupStats.forEach((stats, setup) => {
      if (stats.netR > bestR) {
        bestR = stats.netR
        bestSetup = setup
      }
      if (stats.netR < worstR) {
        worstR = stats.netR
        worstSetup = setup
      }
    })

    const emotionalTrades = all.filter(t => 
      t.emotion === 'Impatient' || t.emotion === 'Revenge Trading' || t.emotion === 'Overtrading Urge'
    )
    const calmTrades = all.filter(t => t.emotion === 'Calm')
    const revengeTrades = all.filter(t => t.emotion === 'Revenge Trading')
    
    const emotionalWinRate = emotionalTrades.length > 0
      ? (emotionalTrades.filter(t => t.result === 'Win').length / emotionalTrades.length) * 100
      : 0
    
    const calmWinRate = calmTrades.length > 0
      ? (calmTrades.filter(t => t.result === 'Win').length / calmTrades.length) * 100
      : 0

    return {
      today: {
        count: today.length,
        wins,
        losses,
        breakevens,
        netR,
        streak: streakData.streak,
        streakType: streakData.type,
      },
      allTime: {
        totalTrades,
        winRate,
        netR: allNetR,
        avgR,
        bestSetup,
        worstSetup,
        emotionalTrades: emotionalTrades.length,
        calmTrades: calmTrades.length,
        revengeTrades: revengeTrades.length,
        pctEmotional: totalTrades > 0 ? (emotionalTrades.length / totalTrades) * 100 : 0,
        pctCalm: totalTrades > 0 ? (calmTrades.length / totalTrades) * 100 : 0,
        emotionalWinRate,
        calmWinRate,
      },
    }
  }, [todayTrades, allTimeTrades])

  // Session-based analytics
  const sessionStats = useMemo(() => calculateSessionStats(allTimeTrades), [allTimeTrades])
  const hourlyPerformance = useMemo(() => calculateHourlyPerformance(allTimeTrades), [allTimeTrades])

  const disciplineAlerts = useMemo((): DisciplineAlert[] => {
    const alerts: DisciplineAlert[] = []
    const today = todayTrades
    
    if (today.length >= 3) {
      const now = Date.now()
      const last3 = today.slice(0, 3)
      const timeWindow = 60 * 60 * 1000
      
      if (last3[2].timestamp > now - timeWindow) {
        alerts.push({
          type: 'overtrading',
          message: 'Overtrading warning: 3+ trades. Slow down.',
          severity: 'warning',
        })
      }
    }
    
    const lastTrade = today[0]
    if (lastTrade?.emotion === 'Revenge Trading') {
      alerts.push({
        type: 'revenge',
        message: 'Revenge trade detected. Take a break.',
        severity: 'danger',
      })
    }
    
    if (lastTrade?.emotion === 'Overtrading Urge') {
      alerts.push({
        type: 'overtrading',
        message: 'Overtrading urge detected. Step away.',
        severity: 'warning',
      })
    }
    
    let consecutiveLosses = 0
    for (const trade of today) {
      if (trade.result === 'Loss') {
        consecutiveLosses++
      } else if (trade.result === 'Win') {
        break
      }
    }
    
    if (consecutiveLosses >= 2) {
      alerts.push({
        type: 'stop-signal',
        message: 'STOP SIGNAL: 2 losses in a row.',
        severity: 'danger',
      })
    }
    
    const emotionalCount = today.filter(t => 
      t.emotion === 'Impatient' || t.emotion === 'Fearful'
    ).length
    
    if (emotionalCount >= 2) {
      alerts.push({
        type: 'emotional',
        message: 'You are trading emotionally. Step away.',
        severity: 'danger',
      })
    }
    
    return alerts
  }, [todayTrades])

  return {
    trades,
    todayTrades,
    allTimeTrades,
    stats,
    disciplineAlerts,
    sessionStats,
    hourlyPerformance,
    addTrade,
    deleteTrade,
    updateTrade,
    isLoaded,
  }
}
