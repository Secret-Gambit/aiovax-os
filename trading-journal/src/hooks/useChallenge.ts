import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Challenge, ChallengeDay, ChallengeSetupInput, DailyTradeInput, AdaptiveAdjustment, RecalculationEvent } from '../types/challenge'
import type { Trade } from '../types/trade'

const CHALLENGE_KEY = 'xauusd-challenge'

// XAUUSD (Gold) specifications
const XAUUSD_PIP_VALUE = 0.01 // $0.01 per pip per 0.01 lot (1 micro lot)
const DEFAULT_STOP_LOSS_PIPS = 50

export const useChallenge = () => {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHALLENGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setChallenge(parsed)
      } catch (e) {
        console.error('Failed to load challenge:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded && challenge) {
      localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge))
    }
  }, [challenge, isLoaded])

  // Compounding calculation: solve for daily rate
  // Formula: target = start * (1 + rate)^days
  // rate = (target/start)^(1/days) - 1
  const calculateDailyRate = useCallback((start: number, target: number, days: number): number => {
    if (start <= 0 || target <= start || days <= 0) return 0
    return Math.pow(target / start, 1 / days) - 1
  }, [])

  // XAUUSD (Gold) contract specifications
  // 1 standard lot (1.00) = $10 per pip
  // 0.10 lot (mini) = $1 per pip
  // 0.01 lot (micro) = $0.10 per pip (10 cents)
  const PIP_VALUE_PER_STANDARD_LOT = 10 // $10 per pip for 1.00 lot on XAUUSD

  // Calculate lot size based on risk parameters
  // Formula: lotSize = riskAmount / (stopLossPips * pipValue)
  const calculateLotSize = useCallback((
    balance: number,
    riskRewardRatio: number,
    targetProfit: number,
    stopLossPips: number = DEFAULT_STOP_LOSS_PIPS
  ): number => {
    // If we need to make $X with R:R of 1:Y, then we risk $X/R per trade
    // Assuming 1 trade per day to maximize lot size and hit targets
    const expectedTradesPerDay = 1
    const profitPerTrade = targetProfit / expectedTradesPerDay
    const riskPerTrade = profitPerTrade / riskRewardRatio
    
    // Calculate lot size in standard lots
    // Formula: lotSize = riskPerTrade / (stopLossPips * pipValuePerStandardLot)
    // Example: $4.625 / (30 pips * $10) = 0.0154 lots
    // 0.0154 lots * $10/pip * 30 pips = $4.62 risk ✓
    const lotSize = riskPerTrade / (stopLossPips * PIP_VALUE_PER_STANDARD_LOT)
    
    // Cap lot size at 5% risk of account per trade maximum
    const maxRiskAmount = balance * 0.05
    const maxLotSize = maxRiskAmount / (stopLossPips * PIP_VALUE_PER_STANDARD_LOT)
    
    // Take the smaller of calculated lot size and max safe lot size
    const safeLotSize = Math.min(lotSize, maxLotSize)
    
    // Round UP to nearest 0.01 (micro lot increment)
    // e.g., 0.015 -> 0.02, 0.008 -> 0.01
    const roundedUp = Math.ceil(safeLotSize * 100) / 100
    return Math.max(0.01, roundedUp)
  }, [])

  // Create challenge plan
  const createChallenge = useCallback((input: ChallengeSetupInput): Challenge => {
    const { name, startBalance, targetBalance, riskRewardRatio, maxDays, avgStopLossPips } = input
    
    // Calculate required daily compound rate
    const dailyRate = calculateDailyRate(startBalance, targetBalance, maxDays)
    
    // Calculate initial lot size for day 1
    const day1Target = startBalance * dailyRate
    const initialLotSize = calculateLotSize(startBalance, riskRewardRatio, day1Target, avgStopLossPips)
    
    // Generate all days
    const days: ChallengeDay[] = []
    let currentBalance = startBalance
    
    for (let i = 1; i <= maxDays; i++) {
      const targetProfit = currentBalance * dailyRate
      const targetBalance = currentBalance + targetProfit
      const lotSize = calculateLotSize(currentBalance, riskRewardRatio, targetProfit, avgStopLossPips)
      
      days.push({
        dayNumber: i,
        date: Date.now() + (i - 1) * 24 * 60 * 60 * 1000, // Start from tomorrow
        targetProfit,
        targetBalance,
        actualProfit: null,
        actualBalance: null,
        trades: [],
        status: 'pending',
        lotSize,
      })
      
      currentBalance = targetBalance
    }
    
    const challenge: Challenge = {
      id: `challenge_${Date.now()}`,
      name,
      createdAt: Date.now(),
      startBalance,
      targetBalance,
      riskRewardRatio,
      maxDays,
      avgStopLossPips,
      requiredDailyRate: dailyRate,
      initialLotSize,
      days,
      currentDay: 1,
      status: 'active',
      totalExtensions: 0,
      recalculationLog: [],
    }
    
    setChallenge(challenge)
    return challenge
  }, [calculateDailyRate, calculateLotSize])

  // Get current day data
  const currentDayData = useMemo(() => {
    if (!challenge) return null
    return challenge.days.find(d => d.dayNumber === challenge.currentDay) || null
  }, [challenge])

  // Get progress stats
  const progressStats = useMemo(() => {
    if (!challenge) return null
    
    const completedDays = challenge.days.filter(d => d.status !== 'pending')
    const passedDays = challenge.days.filter(d => d.status === 'passed')
    const failedDays = challenge.days.filter(d => d.status === 'failed')
    const extendedDays = challenge.days.filter(d => d.status === 'extended')
    
    const totalProfit = completedDays.reduce((sum, d) => sum + (d.actualProfit || 0), 0)
    const currentBalance = challenge.startBalance + totalProfit
    const progressPercent = ((currentBalance - challenge.startBalance) / (challenge.targetBalance - challenge.startBalance)) * 100
    
    return {
      currentBalance,
      totalProfit,
      progressPercent: Math.max(0, Math.min(100, progressPercent)),
      daysCompleted: completedDays.length,
      daysPassed: passedDays.length,
      daysFailed: failedDays.length,
      daysExtended: extendedDays.length,
      daysRemaining: challenge.maxDays - completedDays.length,
      isOnTrack: currentBalance >= (challenge.days[challenge.currentDay - 1]?.targetBalance || challenge.startBalance),
    }
  }, [challenge])

  // Adaptive recalculation logic
  const recalculatePlan = useCallback((
    dayNumber: number,
    actualProfit: number,
    adjustmentType: 'stay' | 'extend' | 'reduce_risk',
    additionalDays?: number,
    trades?: Trade[],
    notes?: string
  ): AdaptiveAdjustment => {
    if (!challenge) {
      return {
        type: 'stay_course',
        newDailyTarget: 0,
        newLotSize: 0,
        daysRemaining: 0,
        canComplete: false,
        message: 'No active challenge',
      }
    }
    
    // Update the day that was just completed
    const updatedDays = [...challenge.days]
    const dayIndex = dayNumber - 1
    const day = updatedDays[dayIndex]
    
    // Calculate actual balance after this day
    const previousBalance = dayNumber === 1 
      ? challenge.startBalance 
      : updatedDays[dayIndex - 1].actualBalance || updatedDays[dayIndex - 1].targetBalance
    
    const actualBalance = previousBalance + actualProfit
    
    // Determine day status
    let dayStatus: 'passed' | 'failed' | 'extended'
    if (actualProfit >= day.targetProfit) {
      dayStatus = 'passed'
    } else if (actualBalance < challenge.startBalance * 0.5) {
      // 50% drawdown - force extension
      dayStatus = 'failed'
      adjustmentType = 'extend'
    } else {
      dayStatus = adjustmentType === 'extend' ? 'extended' : 'failed'
    }
    
    // Create new day object (immutable update for React)
    updatedDays[dayIndex] = {
      ...day,
      status: dayStatus,
      actualProfit,
      actualBalance,
      trades: trades && trades.length > 0 ? trades : day.trades,
      notes: notes || day.notes
    }
    
    // Calculate remaining plan
    const remainingDays = challenge.maxDays - dayNumber
    const remainingProfit = challenge.targetBalance - actualBalance
    
    // Check if mathematically possible
    const canComplete = remainingProfit > 0 && remainingDays > 0
    
    let newDailyRate = challenge.requiredDailyRate
    let newDays = remainingDays
    let message = ''
    
    if (adjustmentType === 'extend' && additionalDays) {
      // User wants to add more days
      newDays = remainingDays + additionalDays
      newDailyRate = calculateDailyRate(actualBalance, challenge.targetBalance, newDays)
      message = `Extended by ${additionalDays} days. New daily target adjusted.`
    } else if (adjustmentType === 'stay' && canComplete) {
      // Stay on course - increase daily target
      newDailyRate = calculateDailyRate(actualBalance, challenge.targetBalance, remainingDays)
      message = 'Staying on timeline. Daily target increased to compensate.'
    } else if (adjustmentType === 'reduce_risk') {
      // Target exceeded - reduce risk for next trades
      newDailyRate = calculateDailyRate(actualBalance, challenge.targetBalance, remainingDays) * 0.8 // 20% buffer
      message = 'Ahead of schedule! Reducing risk to protect profits.'
    }
    
    // Recalculate all future days
    let runningBalance = actualBalance
    for (let i = dayNumber; i < updatedDays.length; i++) {
      const targetProfit = runningBalance * newDailyRate
      const targetBalance = runningBalance + targetProfit
      const lotSize = calculateLotSize(runningBalance, challenge.riskRewardRatio, targetProfit, challenge.avgStopLossPips)
      
      updatedDays[i] = {
        ...updatedDays[i],
        targetProfit,
        targetBalance,
        lotSize,
      }
      
      runningBalance = targetBalance
    }
    
    // Add recalculation event
    const recalculationEvent: RecalculationEvent = {
      timestamp: Date.now(),
      dayNumber,
      reason: adjustmentType === 'extend' ? 'target_not_met' : 
              adjustmentType === 'reduce_risk' ? 'target_exceeded' : 'target_not_met',
      previousDailyRate: challenge.requiredDailyRate,
      newDailyRate,
      previousDaysRemaining: remainingDays,
      newDaysRemaining: newDays,
      message,
    }
    
    // Update challenge
    setChallenge({
      ...challenge,
      days: updatedDays,
      currentDay: dayNumber + 1,
      requiredDailyRate: newDailyRate,
      maxDays: challenge.maxDays + (adjustmentType === 'extend' ? (additionalDays || 0) : 0),
      totalExtensions: challenge.totalExtensions + (adjustmentType === 'extend' ? 1 : 0),
      status: actualBalance >= challenge.targetBalance ? 'completed' : 'active',
      recalculationLog: [...challenge.recalculationLog, recalculationEvent],
    })
    
    // Calculate new lot size for next day
    const nextDay = updatedDays[dayNumber]
    
    return {
      type: adjustmentType === 'extend' ? 'extend_timeframe' : 
            adjustmentType === 'reduce_risk' ? 'reduce_risk' : 'stay_course',
      newDailyTarget: nextDay?.targetProfit || 0,
      newLotSize: nextDay?.lotSize || 0,
      daysRemaining: newDays,
      canComplete,
      message,
    }
  }, [challenge, calculateDailyRate, calculateLotSize])

  // Log trades for a specific day
  const logDayTrades = useCallback((input: DailyTradeInput): AdaptiveAdjustment => {
    const { dayNumber, profit, trades, notes } = input
    
    // Determine adjustment type based on performance
    if (!challenge) {
      return {
        type: 'stay_course',
        newDailyTarget: 0,
        newLotSize: 0,
        daysRemaining: 0,
        canComplete: false,
        message: 'No challenge active',
      }
    }
    
    const day = challenge.days.find(d => d.dayNumber === dayNumber)
    if (!day) {
      return {
        type: 'stay_course',
        newDailyTarget: 0,
        newLotSize: 0,
        daysRemaining: 0,
        canComplete: false,
        message: 'Day not found',
      }
    }
    
    // Determine if target was met, exceeded, or missed
    const targetDiff = profit - day.targetProfit
    
    let adjustmentType: 'stay' | 'extend' | 'reduce_risk' = 'stay'
    
    if (targetDiff >= day.targetProfit * 0.5) {
      // Exceeded target by 50%+
      adjustmentType = 'reduce_risk'
    } else if (profit < day.targetProfit) {
      // Missed target
      adjustmentType = 'stay'
    }
    
    return recalculatePlan(dayNumber, profit, adjustmentType, trades, notes)
  }, [challenge, recalculatePlan])

  // Delete challenge
  const deleteChallenge = useCallback(() => {
    setChallenge(null)
    localStorage.removeItem(CHALLENGE_KEY)
  }, [])

  // Get lot size for current day
  const getCurrentLotSize = useCallback((): number => {
    if (!challenge || !currentDayData) return 0
    return currentDayData.lotSize
  }, [challenge, currentDayData])

  // Check if major drawdown (>50%)
  const isMajorDrawdown = useCallback((): boolean => {
    if (!challenge || !progressStats) return false
    return progressStats.currentBalance < challenge.startBalance * 0.5
  }, [challenge, progressStats])

  return {
    challenge,
    currentDayData,
    progressStats,
    isLoaded,
    createChallenge,
    logDayTrades,
    recalculatePlan,
    deleteChallenge,
    getCurrentLotSize,
    isMajorDrawdown,
  }
}
