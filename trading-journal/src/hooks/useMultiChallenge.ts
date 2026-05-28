import { useState, useEffect, useCallback } from 'react'
import type { Challenge, ChallengeDay, ChallengePortfolio, ChallengeSetupInput, DailyTradeInput } from '../types/challenge'
import type { Trade } from '../types/trade'

const CHALLENGE_PORTFOLIO_KEY = 'challenge-portfolio'

export function useMultiChallenge() {
  const [portfolio, setPortfolio] = useState<ChallengePortfolio>({
    challenges: [],
    activeChallengeId: null,
    totalCapitalDeployed: 0,
    totalTargetCapital: 0,
    combinedProgressPercent: 0
  })

  // Load challenges from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHALLENGE_PORTFOLIO_KEY)
    if (saved) {
      try {
        const parsed: ChallengePortfolio = JSON.parse(saved)
        setPortfolio(parsed)
      } catch {
        console.error('Failed to parse challenge portfolio')
      }
    }
  }, [])

  // Save to localStorage whenever portfolio changes
  useEffect(() => {
    localStorage.setItem(CHALLENGE_PORTFOLIO_KEY, JSON.stringify(portfolio))
  }, [portfolio])

  // Calculate portfolio metrics
  const updatePortfolioMetrics = useCallback((challenges: Challenge[]): ChallengePortfolio => {
    const totalCapital = challenges.reduce((sum, c) => sum + c.startBalance, 0)
    const totalTarget = challenges.reduce((sum, c) => sum + c.targetBalance, 0)
    
    const activeChallenges = challenges.filter(c => c.status === 'active')
    
    // Calculate combined progress
    let totalProgress = 0
    activeChallenges.forEach(c => {
      const currentDay = c.days.find(d => d.dayNumber === c.currentDay)
      const currentBalance = currentDay?.actualBalance || c.startBalance
      const progress = (currentBalance - c.startBalance) / (c.targetBalance - c.startBalance)
      totalProgress += Math.max(0, Math.min(1, progress))
    })
    
    const combinedProgress = activeChallenges.length > 0 
      ? (totalProgress / activeChallenges.length) * 100 
      : 0

    // Find best performing challenge
    let bestChallengeId: string | undefined
    let bestProgress = -1
    
    activeChallenges.forEach(c => {
      const currentDay = c.days.find(d => d.dayNumber === c.currentDay)
      const currentBalance = currentDay?.actualBalance || c.startBalance
      const progress = (currentBalance - c.startBalance) / (c.targetBalance - c.startBalance)
      
      if (progress > bestProgress) {
        bestProgress = progress
        bestChallengeId = c.id
      }
    })

    // Find riskiest challenge (most behind schedule)
    let riskiestId: string | undefined
    let lowestHealth = 1
    
    activeChallenges.forEach(c => {
      const daysRemaining = c.maxDays - c.currentDay + 1
      const currentDay = c.days.find(d => d.dayNumber === c.currentDay)
      const currentBalance = currentDay?.actualBalance || c.startBalance
      const remainingProfit = c.targetBalance - currentBalance
      
      // Health = can we make it?
      const requiredDaily = daysRemaining > 0 ? remainingProfit / daysRemaining : 0
      const health = requiredDaily > 0 && c.requiredDailyRate > 0 
        ? c.requiredDailyRate / requiredDaily 
        : 1
      
      if (health < lowestHealth) {
        lowestHealth = health
        riskiestId = c.id
      }
    })

    return {
      challenges,
      activeChallengeId: portfolio.activeChallengeId,
      totalCapitalDeployed: totalCapital,
      totalTargetCapital: totalTarget,
      combinedProgressPercent: combinedProgress,
      bestPerformingChallengeId: bestChallengeId,
      riskiestChallengeId: riskiestId,
      recommendedFocus: lowestHealth < 0.8 ? riskiestId : undefined
    }
  }, [portfolio.activeChallengeId])

  // Create a new challenge
  const createChallenge = useCallback((input: ChallengeSetupInput): Challenge => {
    const id = `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const challenge: Challenge = {
      id,
      name: input.name || `Challenge ${portfolio.challenges.length + 1}`,
      accountLabel: input.accountLabel || `Account #${portfolio.challenges.length + 1}`,
      startBalance: input.startBalance,
      targetBalance: input.targetBalance,
      maxDays: input.maxDays,
      currentDay: 1,
      riskRewardRatio: input.riskRewardRatio || 2,
      avgStopLossPips: input.avgStopLossPips || 50,
      
      // Trading configuration
      tradingFrequency: input.tradingFrequency || 'daily',
      weeklySchedule: input.tradingFrequency === 'weekly' ? {
        enabled: true,
        tradingDays: input.tradingDays || ['monday', 'wednesday', 'friday'],
        tradesPerWeek: input.maxTradesPerWeek || 3,
        tradesPerTradingDay: input.tradesPerDay || 1
      } : undefined,
      maxTradesPerDay: input.tradesPerDay || 1,
      maxTradesPerWeek: input.maxTradesPerWeek,
      
      // Risk settings
      riskPerTradePercent: input.riskPerTradePercent || 1,
      riskPerDayPercent: input.riskPerDayPercent || 1,
      allowTradeSizeIncrease: input.allowTradeSizeIncrease ?? false,
      
      // Initialize days
      days: [],
      status: 'active',
      totalExtensions: 0,
      recalculationLog: [],
      initialLotSize: 0.01, // Default initial lot size
      requiredDailyRate: (input.targetBalance - input.startBalance) / input.startBalance / input.maxDays,
      requiredWeeklyRate: input.tradingFrequency === 'weekly' 
        ? (input.targetBalance - input.startBalance) / input.startBalance / (input.maxDays / 7)
        : undefined,
      createdAt: Date.now(),
      priority: input.priority || portfolio.challenges.length + 1
    }

    // Generate days based on configuration
    const days = generateChallengeDays(challenge)
    challenge.days = days

    const newChallenges = [...portfolio.challenges, challenge]
    const newPortfolio = updatePortfolioMetrics(newChallenges)
    
    // If first challenge, set as active
    if (portfolio.challenges.length === 0) {
      newPortfolio.activeChallengeId = challenge.id
    }
    
    setPortfolio(newPortfolio)
    return challenge
  }, [portfolio.challenges, updatePortfolioMetrics])

  // Delete a challenge
  const deleteChallenge = useCallback((challengeId: string) => {
    const newChallenges = portfolio.challenges.filter(c => c.id !== challengeId)
    const newPortfolio = updatePortfolioMetrics(newChallenges)
    
    // If deleting active challenge, switch to another
    if (portfolio.activeChallengeId === challengeId && newChallenges.length > 0) {
      newPortfolio.activeChallengeId = newChallenges[0].id
    } else if (newChallenges.length === 0) {
      newPortfolio.activeChallengeId = null
    }
    
    setPortfolio(newPortfolio)
  }, [portfolio.challenges, portfolio.activeChallengeId, updatePortfolioMetrics])

  // Switch active challenge
  const switchActiveChallenge = useCallback((challengeId: string) => {
    const challenge = portfolio.challenges.find(c => c.id === challengeId)
    if (challenge) {
      setPortfolio(prev => ({
        ...prev,
        activeChallengeId: challengeId
      }))
    }
  }, [portfolio.challenges])

  // Get active challenge
  const getActiveChallenge = useCallback((): Challenge | null => {
    return portfolio.challenges.find(c => c.id === portfolio.activeChallengeId) || null
  }, [portfolio.challenges, portfolio.activeChallengeId])

  // Reorder challenges by priority
  const reorderChallenges = useCallback((newOrder: string[]) => {
    const reordered = newOrder
      .map(id => portfolio.challenges.find(c => c.id === id))
      .filter((c): c is Challenge => c !== undefined)
      .map((c, index) => ({ ...c, priority: index + 1 }))
    
    const newPortfolio = updatePortfolioMetrics(reordered)
    setPortfolio(newPortfolio)
  }, [portfolio.challenges, updatePortfolioMetrics])

  // Link challenges (for copying trades)
  const linkChallenges = useCallback((sourceId: string, targetIds: string[]) => {
    const newChallenges = portfolio.challenges.map(c => {
      if (c.id === sourceId) {
        return { ...c, linkedChallengeIds: [...(c.linkedChallengeIds || []), ...targetIds] }
      }
      if (targetIds.includes(c.id)) {
        return { 
          ...c, 
          isCopyChallenge: true, 
          sourceChallengeId: sourceId 
        }
      }
      return c
    })
    
    const newPortfolio = updatePortfolioMetrics(newChallenges)
    setPortfolio(newPortfolio)
  }, [portfolio.challenges, updatePortfolioMetrics])

  // Get all active challenges
  const getActiveChallenges = useCallback((): Challenge[] => {
    return portfolio.challenges.filter(c => c.status === 'active')
  }, [portfolio.challenges])

  // Get challenges that need attention
  const getChallengesNeedingAttention = useCallback((): Challenge[] => {
    return portfolio.challenges.filter(c => {
      if (c.status !== 'active') return false
      
      const daysRemaining = c.maxDays - c.currentDay + 1
      const currentDay = c.days.find(d => d.dayNumber === c.currentDay)
      const currentBalance = currentDay?.actualBalance || c.startBalance
      const remainingProfit = c.targetBalance - currentBalance
      const requiredDaily = daysRemaining > 0 ? remainingProfit / daysRemaining : 0
      
      // Needs attention if required daily > 2x original target
      return requiredDaily > c.requiredDailyRate * 2
    })
  }, [portfolio.challenges])

  // Get completed challenges
  const getCompletedChallenges = useCallback((): Challenge[] => {
    return portfolio.challenges.filter(c => c.status === 'completed')
  }, [portfolio.challenges])

  return {
    portfolio,
    createChallenge,
    deleteChallenge,
    switchActiveChallenge,
    getActiveChallenge,
    getActiveChallenges,
    reorderChallenges,
    linkChallenges,
    getChallengesNeedingAttention,
    getCompletedChallenges,
    updatePortfolioMetrics
  }
}

// Helper function to generate challenge days
function generateChallengeDays(challenge: Challenge): ChallengeDay[] {
  const days = []
  const startDate = new Date(challenge.createdAt)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  
  let currentDate = new Date(startDate)
  let runningBalance = challenge.startBalance
  
  for (let i = 1; i <= challenge.maxDays; i++) {
    const dayOfWeek = dayNames[currentDate.getDay()] as Challenge['days'][0]['dayOfWeek']
    const isTradingDay = challenge.tradingFrequency === 'daily' || 
      (challenge.tradingFrequency === 'weekly' && challenge.weeklySchedule?.tradingDays.includes(dayOfWeek))
    
    const targetProfit = runningBalance * challenge.requiredDailyRate
    const targetBalance = runningBalance + targetProfit
    
    // Calculate lot size for this day
    const dailyRisk = targetProfit / challenge.riskRewardRatio
    const riskPerTrade = challenge.maxTradesPerDay > 0 
      ? dailyRisk / challenge.maxTradesPerDay 
      : dailyRisk
    const pipValue = 10
    const lotSize = riskPerTrade / (challenge.avgStopLossPips * pipValue)
    
    days.push({
      dayNumber: i,
      date: currentDate.getTime(),
      targetProfit,
      targetBalance,
      actualProfit: null,
      actualBalance: null,
      trades: [],
      status: 'pending',
      lotSize,
      isTradingDay,
      dayOfWeek,
      maxTradesPerDay: isTradingDay ? challenge.maxTradesPerDay : 0
    })
    
    runningBalance = targetBalance
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return days
}
