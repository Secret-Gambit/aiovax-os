import type { Challenge, ChallengeDay, TradeAllocation, WeeklySchedule, DayOfWeek } from '../types/challenge'
import type { Trade } from '../types/trade'

// Risk allocation strategies
export type AllocationStrategy = 'equal' | 'descending' | 'ascending' | 'first-heavy' | 'last-heavy'

/**
 * Calculate lot size per trade based on allocation strategy
 */
export function calculateTradeAllocation(
  challenge: Challenge,
  day: ChallengeDay,
  strategy: AllocationStrategy = 'equal'
): TradeAllocation[] {
  const totalDailyRisk = day.targetProfit / challenge.riskRewardRatio
  const numTrades = challenge.maxTradesPerDay
  const pipValue = 10 // XAUUSD
  
  const allocations: TradeAllocation[] = []
  
  for (let i = 0; i < numTrades; i++) {
    let riskPercent: number
    
    switch (strategy) {
      case 'equal':
        // Equal risk across all trades
        riskPercent = 1 / numTrades
        break
        
      case 'descending':
        // First trade gets most risk, decreases
        const totalWeightDesc = (numTrades * (numTrades + 1)) / 2
        riskPercent = (numTrades - i) / totalWeightDesc
        break
        
      case 'ascending':
        // First trade gets least risk, increases
        const totalWeightAsc = (numTrades * (numTrades + 1)) / 2
        riskPercent = (i + 1) / totalWeightAsc
        break
        
      case 'first-heavy':
        // 60% on first trade, rest distributed
        if (i === 0) {
          riskPercent = 0.6
        } else {
          riskPercent = 0.4 / (numTrades - 1)
        }
        break
        
      case 'last-heavy':
        // Save most risk for later trades
        if (i === numTrades - 1) {
          riskPercent = 0.6
        } else {
          riskPercent = 0.4 / (numTrades - 1)
        }
        break
        
      default:
        riskPercent = 1 / numTrades
    }
    
    const riskAmount = totalDailyRisk * riskPercent
    const lotSize = riskAmount / (challenge.avgStopLossPips * pipValue)
    
    allocations.push({
      tradeNumber: i + 1,
      maxLotSize: lotSize,
      riskAmount,
      percentageOfDailyRisk: riskPercent * 100,
      isTaken: false
    })
  }
  
  return allocations
}

/**
 * Get remaining risk budget for the day
 */
export function getRemainingRiskBudget(
  day: ChallengeDay,
  completedTrades: Trade[]
): number {
  if (!day.tradeAllocations) {
    // Simple calculation if no detailed allocations
    const dailyTarget = day.targetProfit
    const actualResults = completedTrades.reduce((sum, t) => sum + (t.rMultiple * 0.01), 0)
    return Math.max(0, dailyTarget - actualResults)
  }
  
  // Calculate remaining from allocation slots
  const remainingSlots = day.tradeAllocations.filter(a => !a.isTaken)
  return remainingSlots.reduce((sum, a) => sum + a.riskAmount, 0)
}

/**
 * Get next available trade slot
 */
export function getNextTradeSlot(
  day: ChallengeDay
): TradeAllocation | null {
  if (!day.tradeAllocations) return null
  return day.tradeAllocations.find(a => !a.isTaken) || null
}

/**
 * Mark trade slot as used
 */
export function markTradeSlotUsed(
  day: ChallengeDay,
  slotNumber: number,
  tradeId: string,
  actualProfit: number
): ChallengeDay {
  if (!day.tradeAllocations) return day
  
  const updatedAllocations = day.tradeAllocations.map(a => 
    a.tradeNumber === slotNumber 
      ? { ...a, isTaken: true, tradeId, actualProfit }
      : a
  )
  
  return {
    ...day,
    tradeAllocations: updatedAllocations,
    remainingRiskBudget: updatedAllocations
      .filter(a => !a.isTaken)
      .reduce((sum, a) => sum + a.riskAmount, 0)
  }
}

/**
 * Generate days for weekly trading schedule
 */
export function generateWeeklyScheduleDays(
  startDate: Date,
  numWeeks: number,
  tradingDays: DayOfWeek[],
  tradesPerTradingDay: number,
  weeklyTarget: number
): { dayNumber: number; date: Date; isTradingDay: boolean; dayOfWeek: DayOfWeek; tradesAllowed: number }[] {
  const days: { dayNumber: number; date: Date; isTradingDay: boolean; dayOfWeek: DayOfWeek; tradesAllowed: number }[] = []
  const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  
  let currentDate = new Date(startDate)
  let dayNumber = 1
  
  for (let week = 0; week < numWeeks; week++) {
    for (let i = 0; i < 7; i++) {
      const dayName = dayNames[currentDate.getDay()]
      const isTradingDay = tradingDays.includes(dayName)
      
      days.push({
        dayNumber,
        date: new Date(currentDate),
        isTradingDay,
        dayOfWeek: dayName,
        tradesAllowed: isTradingDay ? tradesPerTradingDay : 0
      })
      
      dayNumber++
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  return days
}

/**
 * Calculate weekly targets for weekly trading mode
 */
export function calculateWeeklyTargets(
  challenge: Challenge,
  currentBalance: number
): number[] {
  if (challenge.tradingFrequency !== 'weekly' || !challenge.weeklySchedule) {
    // Fallback to daily mode
    const remainingProfit = challenge.targetBalance - currentBalance
    const remainingDays = challenge.maxDays - challenge.currentDay + 1
    const dailyTarget = remainingDays > 0 ? remainingProfit / remainingDays : 0
    return new Array(remainingDays).fill(dailyTarget)
  }
  
  const schedule = challenge.weeklySchedule
  const remainingWeeks = Math.ceil((challenge.maxDays - challenge.currentDay + 1) / 7)
  const remainingProfit = challenge.targetBalance - currentBalance
  
  // Count remaining trading days
  let remainingTradingDays = 0
  const currentDay = challenge.currentDay
  for (let i = currentDay - 1; i < challenge.days.length; i++) {
    if (challenge.days[i]?.isTradingDay) {
      remainingTradingDays++
    }
  }
  
  // Calculate weekly target
  const weeklyTarget = remainingWeeks > 0 ? remainingProfit / remainingWeeks : 0
  
  // Distribute across weeks
  const weeklyTargets: number[] = []
  for (let i = 0; i < remainingWeeks; i++) {
    weeklyTargets.push(weeklyTarget)
  }
  
  return weeklyTargets
}

/**
 * Get recommended trade size for current situation
 */
export function getRecommendedTradeSize(
  challenge: Challenge,
  currentBalance: number,
  completedTradesToday: number,
  dayPerformance: 'ahead' | 'on-track' | 'behind'
): { lotSize: number; riskAmount: number; reason: string } {
  const dailyTarget = challenge.days[challenge.currentDay - 1]?.targetProfit || 0
  const totalDailyRisk = dailyTarget / challenge.riskRewardRatio
  const remainingTrades = challenge.maxTradesPerDay - completedTradesToday
  
  if (remainingTrades <= 0) {
    return { lotSize: 0, riskAmount: 0, reason: 'Daily trade limit reached' }
  }
  
  let riskMultiplier = 1
  let reason = 'Standard allocation'
  
  // Adjust based on performance
  switch (dayPerformance) {
    case 'ahead':
      riskMultiplier = 0.8 // Reduce risk when ahead
      reason = 'Reduced risk - you are ahead of target'
      break
    case 'behind':
      riskMultiplier = 1.2 // Slightly increase if behind (but capped)
      reason = 'Slight increase - catching up on target'
      break
    case 'on-track':
    default:
      riskMultiplier = 1
      reason = 'On track - standard allocation'
  }
  
  // Cap risk multiplier
  riskMultiplier = Math.min(riskMultiplier, 1.3) // Never risk more than 30% extra
  
  // Calculate remaining risk
  const remainingRisk = totalDailyRisk * riskMultiplier
  const riskPerTrade = remainingRisk / remainingTrades
  
  // Calculate lot size
  const pipValue = 10
  const lotSize = riskPerTrade / (challenge.avgStopLossPips * pipValue)
  
  return {
    lotSize,
    riskAmount: riskPerTrade,
    reason
  }
}

/**
 * Check if should trade today (for weekly mode)
 */
export function shouldTradeToday(
  challenge: Challenge,
  currentDayNumber: number
): { shouldTrade: boolean; reason: string; tradesAllowed: number } {
  const day = challenge.days.find(d => d.dayNumber === currentDayNumber)
  
  if (!day) {
    return { shouldTrade: false, reason: 'Day not found in challenge', tradesAllowed: 0 }
  }
  
  if (challenge.tradingFrequency === 'daily') {
    return { 
      shouldTrade: true, 
      reason: 'Daily trading mode - trade every day',
      tradesAllowed: challenge.maxTradesPerDay
    }
  }
  
  if (challenge.tradingFrequency === 'weekly' && challenge.weeklySchedule) {
    if (!day.isTradingDay) {
      return { 
        shouldTrade: false, 
        reason: `Not a trading day (${day.dayOfWeek}). Your schedule: ${challenge.weeklySchedule.tradingDays.join(', ')}`,
        tradesAllowed: 0
      }
    }
    
    return { 
      shouldTrade: true, 
      reason: `Trading day - ${challenge.weeklySchedule.tradesPerTradingDay} trades allowed`,
      tradesAllowed: challenge.weeklySchedule.tradesPerTradingDay
    }
  }
  
  return { shouldTrade: true, reason: 'Custom schedule', tradesAllowed: challenge.maxTradesPerDay }
}

/**
 * Validate if trade fits within daily/weekly limits
 */
export function validateTradeLimits(
  challenge: Challenge,
  day: ChallengeDay,
  proposedLotSize: number,
  currentBalance: number
): { isValid: boolean; warning?: string; maxAllowedLotSize: number } {
  const maxRiskPerTrade = currentBalance * (challenge.riskPerTradePercent / 100)
  const pipValue = 10
  const maxLotSize = maxRiskPerTrade / (challenge.avgStopLossPips * pipValue)
  
  // Check per-trade limit
  if (proposedLotSize > maxLotSize * 1.1) { // 10% tolerance
    return {
      isValid: false,
      warning: `Trade size (${proposedLotSize.toFixed(2)}) exceeds max allowed (${maxLotSize.toFixed(2)})`,
      maxAllowedLotSize: maxLotSize
    }
  }
  
  // Check daily limit
  const dailyRisk = day.targetProfit / challenge.riskRewardRatio
  const usedRisk = day.tradeAllocations
    ?.filter(a => a.isTaken)
    .reduce((sum, a) => sum + a.riskAmount, 0) || 0
  const remainingRisk = dailyRisk - usedRisk
  const remainingLotSize = remainingRisk / (challenge.avgStopLossPips * pipValue)
  
  if (proposedLotSize > remainingLotSize) {
    return {
      isValid: false,
      warning: `Not enough risk budget remaining. Max: ${remainingLotSize.toFixed(2)} lots`,
      maxAllowedLotSize: remainingLotSize
    }
  }
  
  // Check trade count limit
  const usedTrades = day.tradeAllocations?.filter(a => a.isTaken).length || 0
  if (usedTrades >= challenge.maxTradesPerDay) {
    return {
      isValid: false,
      warning: `Daily trade limit reached (${challenge.maxTradesPerDay} trades)`,
      maxAllowedLotSize: 0
    }
  }
  
  return {
    isValid: true,
    maxAllowedLotSize: Math.min(maxLotSize, remainingLotSize)
  }
}

/**
 * Generate smart allocation recommendations
 */
export function getSmartAllocationRecommendation(
  challenge: Challenge,
  day: ChallengeDay,
  tradeHistory: Trade[],
  currentBalance: number
): { strategy: AllocationStrategy; reason: string } {
  const recentTrades = tradeHistory.slice(-10) // Last 10 trades
  const winRate = recentTrades.length > 0
    ? recentTrades.filter(t => t.result === 'Win').length / recentTrades.length
    : 0.5
  
  const avgR = recentTrades.length > 0
    ? recentTrades.reduce((sum, t) => sum + t.rMultiple, 0) / recentTrades.length
    : 2
  
  const isAhead = day.actualProfit !== null && day.actualProfit > day.targetProfit * 0.8
  const isBehind = day.actualProfit !== null && day.actualProfit < day.targetProfit * 0.3
  
  // Decision tree for best strategy
  if (winRate > 0.6 && avgR > 2) {
    return {
      strategy: 'first-heavy',
      reason: 'Strong performance - capitalize early with larger first trade'
    }
  }
  
  if (winRate < 0.4) {
    return {
      strategy: 'ascending',
      reason: 'Lower win rate - start small and scale up if momentum builds'
    }
  }
  
  if (isBehind && challenge.currentDay > challenge.maxDays * 0.7) {
    return {
      strategy: 'last-heavy',
      reason: 'Behind schedule - save firepower for end of day if needed'
    }
  }
  
  if (isAhead) {
    return {
      strategy: 'equal',
      reason: 'On track - steady, consistent approach'
    }
  }
  
  return {
    strategy: 'equal',
    reason: 'Default balanced allocation'
  }
}
