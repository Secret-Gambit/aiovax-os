import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Trade } from '../types/trade'

const GOALS_KEY = 'xauusd-weekly-goals'

export interface WeeklyGoal {
  weekStart: number // timestamp of Monday 00:00
  targetR: number
  currentR: number
}

export const useWeeklyGoals = (trades: Trade[]) => {
  const [goals, setGoals] = useState<WeeklyGoal[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load goals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(GOALS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setGoals(parsed)
      } catch (e) {
        console.error('Failed to parse weekly goals:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save goals to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
    }
  }, [goals, isLoaded])

  // Get current week start (Monday 00:00)
  const getCurrentWeekStart = useCallback(() => {
    const now = new Date()
    const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    const monday = new Date(now.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday.getTime()
  }, [])

  // Get current week's goal
  const currentWeekStart = useMemo(() => getCurrentWeekStart(), [getCurrentWeekStart])
  
  const currentGoal = useMemo(() => {
    return goals.find(g => g.weekStart === currentWeekStart)
  }, [goals, currentWeekStart])

  // Calculate current week's R from trades
  const calculateWeekR = useCallback((weekStart: number, tradesList: Trade[]) => {
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000
    const weekTrades = tradesList.filter(t => t.timestamp >= weekStart && t.timestamp < weekEnd)
    
    return weekTrades.reduce((sum, t) => {
      if (t.result === 'Win') return sum + t.rMultiple
      if (t.result === 'Loss') return sum - Math.abs(t.rMultiple)
      return sum
    }, 0)
  }, [])

  // Check if we need to show goal prompt (new week, no goal set, no trades yet)
  const shouldShowGoalPrompt = useMemo(() => {
    if (!isLoaded) return false
    if (currentGoal) return false // Already has goal
    
    // Check if any trades this week
    const hasTradesThisWeek = trades.some(t => t.timestamp >= currentWeekStart)
    
    // Show prompt if it's a new week (no trades) or early in week
    return !hasTradesThisWeek
  }, [isLoaded, currentGoal, currentWeekStart, trades, calculateWeekR])

  // Set weekly goal
  const setWeeklyGoal = useCallback((targetR: number) => {
    const existingIndex = goals.findIndex(g => g.weekStart === currentWeekStart)
    const currentR = calculateWeekR(currentWeekStart, trades)
    
    if (existingIndex >= 0) {
      // Update existing
      setGoals(prev => prev.map((g, i) => 
        i === existingIndex ? { ...g, targetR, currentR } : g
      ))
    } else {
      // Add new
      setGoals(prev => [...prev, { weekStart: currentWeekStart, targetR, currentR }])
    }
  }, [currentWeekStart, trades, goals, calculateWeekR])

  // Update current R (called when new trade added)
  const updateCurrentR = useCallback(() => {
    const existingIndex = goals.findIndex(g => g.weekStart === currentWeekStart)
    if (existingIndex >= 0) {
      const currentR = calculateWeekR(currentWeekStart, trades)
      setGoals(prev => prev.map((g, i) => 
        i === existingIndex ? { ...g, currentR } : g
      ))
    }
  }, [currentWeekStart, trades, goals, calculateWeekR])

  // Auto-update current R whenever trades change (e.g., when deleting a trade)
  useEffect(() => {
    if (isLoaded && currentGoal) {
      const currentR = calculateWeekR(currentWeekStart, trades)
      // Only update if R has actually changed
      if (currentR !== currentGoal.currentR) {
        const existingIndex = goals.findIndex(g => g.weekStart === currentWeekStart)
        if (existingIndex >= 0) {
          setGoals(prev => prev.map((g, i) => 
            i === existingIndex ? { ...g, currentR } : g
          ))
        }
      }
    }
  }, [trades, isLoaded, currentGoal, currentWeekStart, calculateWeekR, goals])

  // Progress percentage
  const progress = useMemo(() => {
    if (!currentGoal || currentGoal.targetR <= 0) return 0
    return Math.min(100, Math.max(0, (currentGoal.currentR / currentGoal.targetR) * 100))
  }, [currentGoal])

  // Goal reached?
  const isGoalReached = useMemo(() => {
    return currentGoal ? currentGoal.currentR >= currentGoal.targetR : false
  }, [currentGoal])

  return {
    currentGoal,
    shouldShowGoalPrompt,
    setWeeklyGoal,
    updateCurrentR,
    progress,
    isGoalReached,
    isLoaded,
  }
}
