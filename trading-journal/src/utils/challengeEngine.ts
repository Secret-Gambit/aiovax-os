import type { 
  Challenge, 
  ChallengeDay, 
  AdjustmentStrategy, 
  ChallengeRiskMetrics,
  MonteCarloResult,
  MonteCarloScenario,
  ChallengeScenario,
  AdaptiveAdjustment,
  RecalculationEvent
} from '../types/challenge'
import type { Trade } from '../types/trade'

// Constants for Monte Carlo
const SIMULATION_COUNT = 1000
const DEFAULT_WIN_RATE = 0.45
const DEFAULT_AVG_R = 2.0
const MAX_RISK_OF_RUIN = 0.5
const SAFETY_BUFFER_DAYS = 2

/**
 * Calculate risk metrics for the challenge
 */
export function calculateRiskMetrics(
  challenge: Challenge,
  trades: Trade[],
  currentBalance: number
): ChallengeRiskMetrics {
  const startBalance = challenge.startBalance
  const targetBalance = challenge.targetBalance
  const currentDay = challenge.currentDay
  
  // Calculate current drawdown
  const currentDrawdownPercent = currentBalance < startBalance 
    ? ((startBalance - currentBalance) / startBalance) * 100 
    : 0
  
  // Calculate distance to target
  const distanceToTargetPercent = ((targetBalance - currentBalance) / (targetBalance - startBalance)) * 100
  
  // Calculate historical performance from trades
  const winningTrades = trades.filter(t => t.result === 'Win')
  const losingTrades = trades.filter(t => t.result === 'Loss')
  
  const avgWinRate = trades.length > 0 ? winningTrades.length / trades.length : DEFAULT_WIN_RATE
  const avgRMultiple = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.rMultiple, 0) / trades.length
    : DEFAULT_AVG_R
  
  // Calculate daily volatility
  const dailyProfits = challenge.days
    .filter(d => d.actualProfit !== null)
    .map(d => d.actualProfit as number)
  
  const dailyVolatility = dailyProfits.length > 1
    ? Math.sqrt(
        dailyProfits.reduce((sum, profit, i, arr) => {
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length
          return sum + Math.pow(profit - mean, 2)
        }, 0) / (dailyProfits.length - 1)
      )
    : 0
  
  // Calculate required win rate to pass
  const remainingDays = challenge.maxDays - currentDay + 1
  const remainingProfit = targetBalance - currentBalance
  const avgDailyNeeded = remainingDays > 0 ? remainingProfit / remainingDays : 0
  
  // Simplified Kelly Criterion for required win rate
  const requiredWinRate = avgRMultiple > 0 
    ? 1 / (1 + avgRMultiple) 
    : 0.5
  
  // Calculate risk of ruin (Kelly formula approximation)
  const riskAmount = currentBalance * 0.02 // Assume 2% risk per trade
  const riskOfRuin = avgWinRate > 0 && avgRMultiple > 0
    ? Math.pow((1 - avgWinRate) / (avgWinRate * avgRMultiple), Math.floor(currentBalance / riskAmount))
    : 1
  
  // Calculate lot size recommendations
  const pipValue = 10 // XAUUSD
  const stopLossPips = challenge.avgStopLossPips || 50
  const riskPerTrade = currentBalance * 0.01 // 1% risk per trade
  const recommendedLotSize = (riskPerTrade) / (stopLossPips * pipValue)
  const maxSafeLotSize = (currentBalance * 0.02) / (stopLossPips * pipValue) // 2% max
  
  // Risk adjusted return
  const riskAdjustedReturn = dailyVolatility > 0 
    ? avgRMultiple / dailyVolatility 
    : avgRMultiple
  
  return {
    currentDrawdownPercent,
    distanceToTargetPercent,
    riskOfRuin: Math.min(riskOfRuin, 1),
    dailyVolatility,
    avgWinRate,
    avgRMultiple,
    requiredWinRate,
    maxSafeLotSize,
    recommendedLotSize: Math.min(recommendedLotSize, maxSafeLotSize),
    riskAdjustedReturn
  }
}

/**
 * Monte Carlo Simulation
 * Simulates thousands of possible outcomes based on historical performance
 */
export function runMonteCarloSimulation(
  currentBalance: number,
  targetBalance: number,
  daysRemaining: number,
  riskMetrics: ChallengeRiskMetrics,
  dailyTargets: number[]
): MonteCarloResult {
  const scenarios: MonteCarloScenario[] = []
  let successCount = 0
  let failureCount = 0
  let extensionCount = 0
  const finalBalances: number[] = []
  
  for (let i = 0; i < SIMULATION_COUNT; i++) {
    let balance = currentBalance
    const path: number[] = [balance]
    let maxDrawdown = 0
    let requiredExtension = false
    
    for (let day = 0; day < daysRemaining + SAFETY_BUFFER_DAYS; day++) {
      // Skip if already hit target
      if (balance >= targetBalance) break
      
      // Simulate daily outcome based on historical stats
      const isWin = Math.random() < riskMetrics.avgWinRate
      
      // Randomize R-multiple with some variance
      const rVariance = (Math.random() - 0.5) * riskMetrics.dailyVolatility
      const rMultiple = isWin 
        ? riskMetrics.avgRMultiple + rVariance
        : -1 // Loss is always -1R
      
      // Calculate profit/loss based on risk amount
      const riskAmount = balance * 0.01 // 1% risk
      const dailyResult = rMultiple * riskAmount
      
      balance += dailyResult
      path.push(balance)
      
      // Track max drawdown
      const drawdown = balance < path[0] ? ((path[0] - balance) / path[0]) * 100 : 0
      maxDrawdown = Math.max(maxDrawdown, drawdown)
      
      // Check if extension needed (not making progress)
      if (day >= daysRemaining && balance < targetBalance) {
        requiredExtension = true
      }
    }
    
    const isSuccessful = balance >= targetBalance
    if (isSuccessful) successCount++
    else if (requiredExtension) extensionCount++
    else failureCount++
    
    finalBalances.push(balance)
    
    scenarios.push({
      path,
      finalBalance: balance,
      isSuccessful,
      requiredExtension,
      maxDrawdown
    })
  }
  
  // Calculate statistics
  finalBalances.sort((a, b) => a - b)
  const bestCaseIndex = Math.floor(SIMULATION_COUNT * 0.95)
  const worstCaseIndex = Math.floor(SIMULATION_COUNT * 0.05)
  const medianIndex = Math.floor(SIMULATION_COUNT * 0.5)
  
  const expectedFinalBalance = finalBalances.reduce((a, b) => a + b, 0) / SIMULATION_COUNT
  
  return {
    probabilityOfSuccess: (successCount / SIMULATION_COUNT) * 100,
    probabilityOfFailure: (failureCount / SIMULATION_COUNT) * 100,
    probabilityOfExtension: (extensionCount / SIMULATION_COUNT) * 100,
    expectedFinalBalance,
    bestCaseBalance: finalBalances[bestCaseIndex] || targetBalance,
    worstCaseBalance: finalBalances[worstCaseIndex] || currentBalance,
    medianBalance: finalBalances[medianIndex] || currentBalance,
    simulationsRun: SIMULATION_COUNT,
    scenarios: scenarios.slice(0, 100) // Keep only 100 scenarios for display
  }
}

/**
 * Generate daily targets based on strategy
 */
function generateDailyTargets(
  currentBalance: number,
  targetBalance: number,
  daysRemaining: number,
  strategy: AdjustmentStrategy,
  currentDay: number,
  totalDays: number
): number[] {
  const remainingProfit = targetBalance - currentBalance
  const targets: number[] = []
  
  switch (strategy) {
    case 'stay_course':
      // Linear equal distribution (aggressive)
      const dailyTarget = remainingProfit / daysRemaining
      for (let i = 0; i < daysRemaining; i++) {
        targets.push(dailyTarget)
      }
      break
      
    case 'extend_timeframe':
      // Maintain original target, add more days
      const extendedDays = daysRemaining + SAFETY_BUFFER_DAYS
      const extendedTarget = remainingProfit / extendedDays
      for (let i = 0; i < daysRemaining; i++) {
        targets.push(i < extendedDays ? extendedTarget : 0)
      }
      break
      
    case 'reduce_risk':
      // Front-load smaller targets, increase gradually
      const baseTarget = (remainingProfit / daysRemaining) * 0.8
      const increment = baseTarget * 0.05
      for (let i = 0; i < daysRemaining; i++) {
        targets.push(baseTarget + (increment * i))
      }
      break
      
    case 'surge_recovery':
      // First 30% of days: aggressive, rest: normal
      const surgeDays = Math.max(2, Math.floor(daysRemaining * 0.3))
      const normalDays = daysRemaining - surgeDays
      const surgeAmount = remainingProfit * 0.6 // 60% in surge phase
      const normalAmount = remainingProfit * 0.4 // 40% in normal phase
      
      for (let i = 0; i < surgeDays; i++) {
        targets.push(surgeAmount / surgeDays)
      }
      for (let i = 0; i < normalDays; i++) {
        targets.push(normalAmount / normalDays)
      }
      break
      
    case 'conservative':
      // Steady, reduced targets with buffer
      const safeTarget = (remainingProfit / daysRemaining) * 0.7
      const buffer = remainingProfit * 0.1 // 10% buffer
      const distributedTarget = (remainingProfit - buffer) / daysRemaining
      
      for (let i = 0; i < daysRemaining; i++) {
        targets.push(i === daysRemaining - 1 ? distributedTarget + buffer : distributedTarget)
      }
      break
      
    case 'balanced':
    default:
      // Moderate with slight front-loading
      const balancedBase = remainingProfit / daysRemaining
      const balancedVariance = balancedBase * 0.15
      
      for (let i = 0; i < daysRemaining; i++) {
        // Slightly higher targets earlier
        const variance = balancedVariance * (1 - (i / daysRemaining))
        targets.push(balancedBase + variance)
      }
      break
  }
  
  return targets
}

/**
 * Calculate lot size based on strategy and risk
 */
function calculateLotSizeForStrategy(
  currentBalance: number,
  avgStopLossPips: number,
  strategy: AdjustmentStrategy,
  riskMetrics: ChallengeRiskMetrics,
  dailyTarget: number
): number {
  const pipValue = 10 // XAUUSD
  let riskPercent = 0.01 // Base 1%
  
  // Adjust risk based on strategy
  switch (strategy) {
    case 'stay_course':
    case 'surge_recovery':
      riskPercent = Math.min(0.02, riskMetrics.requiredWinRate * 0.03)
      break
    case 'reduce_risk':
    case 'conservative':
      riskPercent = 0.008 // Lower risk
      break
    case 'balanced':
    default:
      riskPercent = 0.012 // Moderate
      break
  }
  
  // Cap based on risk of ruin
  const maxRisk = (1 - riskMetrics.riskOfRuin) * 0.02
  riskPercent = Math.min(riskPercent, maxRisk)
  
  const riskAmount = currentBalance * riskPercent
  const lotSize = riskAmount / (avgStopLossPips * pipValue)
  
  // Cap at max safe lot size
  return Math.min(lotSize, riskMetrics.maxSafeLotSize)
}

/**
 * Score and compare scenarios
 */
function scoreScenario(
  scenario: ChallengeScenario,
  currentBalance: number,
  targetBalance: number,
  riskMetrics: ChallengeRiskMetrics
): number {
  let score = 0
  
  // Success probability (40% weight)
  score += (scenario.successProbability / 100) * 40
  
  // Risk level bonus/penalty (20% weight)
  const riskScores = { 'low': 20, 'medium': 15, 'high': 5, 'extreme': -10 }
  score += riskScores[scenario.riskLevel]
  
  // Time efficiency - prefer faster completion (20% weight)
  const speedBonus = Math.max(0, (30 - scenario.timeToCompletion) / 30) * 20
  score += speedBonus
  
  // Drawdown consideration (20% weight)
  const drawdownScore = Math.max(0, (10 - scenario.riskMetrics.currentDrawdownPercent) / 10) * 20
  score += drawdownScore
  
  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * Generate a complete scenario with Monte Carlo simulation
 */
function generateScenario(
  id: string,
  name: string,
  strategy: AdjustmentStrategy,
  description: string,
  riskLevel: 'low' | 'medium' | 'high' | 'extreme',
  challenge: Challenge,
  currentBalance: number,
  riskMetrics: ChallengeRiskMetrics,
  additionalDays?: number
): ChallengeScenario {
  const daysRemaining = (challenge.maxDays - challenge.currentDay + 1) + (additionalDays || 0)
  
  // Generate daily targets
  const dailyTargets = generateDailyTargets(
    currentBalance,
    challenge.targetBalance,
    daysRemaining,
    strategy,
    challenge.currentDay,
    challenge.maxDays
  )
  
  // Run Monte Carlo simulation
  const monteCarlo = runMonteCarloSimulation(
    currentBalance,
    challenge.targetBalance,
    daysRemaining,
    riskMetrics,
    dailyTargets
  )
  
  // Calculate required lot size
  const avgDailyTarget = dailyTargets.reduce((a, b) => a + b, 0) / dailyTargets.length
  const requiredLotSize = calculateLotSizeForStrategy(
    currentBalance,
    challenge.avgStopLossPips || 50,
    strategy,
    riskMetrics,
    avgDailyTarget
  )
  
  // Generate projected path (median outcome)
  const projectedPath: number[] = [currentBalance]
  let balance = currentBalance
  
  for (const target of dailyTargets) {
    // Assume hitting target with some variance
    const variance = (Math.random() - 0.5) * 0.2 // ±10% variance
    balance += target * (1 + variance)
    projectedPath.push(balance)
  }
  
  const scenario: ChallengeScenario = {
    id,
    name,
    strategy,
    description,
    riskLevel,
    dailyTargets,
    projectedPath,
    successProbability: monteCarlo.probabilityOfSuccess,
    avgDailyTarget,
    maxDailyTarget: Math.max(...dailyTargets),
    minDailyTarget: Math.min(...dailyTargets),
    requiredLotSize,
    totalRiskAmount: dailyTargets.length * (currentBalance * 0.01),
    timeToCompletion: Math.ceil((challenge.targetBalance - currentBalance) / avgDailyTarget),
    riskMetrics: {
      ...riskMetrics,
      recommendedLotSize: requiredLotSize
    },
    monteCarlo,
    recommendationScore: 0, // Will be calculated
    reasoning: []
  }
  
  // Score and add reasoning
  scenario.recommendationScore = scoreScenario(scenario, currentBalance, challenge.targetBalance, riskMetrics)
  scenario.reasoning = generateReasoning(scenario, riskMetrics, challenge)
  
  return scenario
}

/**
 * Generate human-readable reasoning for scenario
 */
function generateReasoning(
  scenario: ChallengeScenario,
  riskMetrics: ChallengeRiskMetrics,
  challenge: Challenge
): string[] {
  const reasoning: string[] = []
  
  // Success probability reasoning
  if (scenario.successProbability > 80) {
    reasoning.push(`High success probability (${scenario.successProbability.toFixed(1)}%) with this strategy`)
  } else if (scenario.successProbability > 50) {
    reasoning.push(`Moderate success probability (${scenario.successProbability.toFixed(1)}%) - achievable with discipline`)
  } else {
    reasoning.push(`Low success probability (${scenario.successProbability.toFixed(1)}%) - consider adjusting expectations`)
  }
  
  // Risk level
  if (scenario.riskLevel === 'low') {
    reasoning.push('Conservative approach minimizes drawdown risk')
  } else if (scenario.riskLevel === 'extreme') {
    reasoning.push('High risk approach - requires consistent performance')
  }
  
  // Daily targets
  const avgTarget = scenario.avgDailyTarget
  const riskPerTrade = challenge.startBalance * 0.01
  const requiredR = avgTarget / riskPerTrade
  reasoning.push(`Requires ${requiredR.toFixed(1)}R per day on average`)
  
  // Lot size
  if (scenario.requiredLotSize > riskMetrics.maxSafeLotSize * 0.8) {
    reasoning.push(`Lot size near maximum safe threshold - monitor closely`)
  }
  
  // Time considerations
  if (scenario.timeToCompletion > challenge.maxDays - challenge.currentDay) {
    reasoning.push(`May require extension beyond original timeframe`)
  }
  
  return reasoning
}

/**
 * Enhanced Adaptive Recalculation
 * Calculates all scenarios and recommends the best one
 */
export function calculateAdaptiveAdjustment(
  challenge: Challenge,
  currentBalance: number,
  trades: Trade[],
  adjustmentType: AdjustmentStrategy,
  additionalDays?: number
): AdaptiveAdjustment {
  // Calculate risk metrics
  const riskMetrics = calculateRiskMetrics(challenge, trades, currentBalance)
  
  // Generate multiple scenarios
  const strategies: { strategy: AdjustmentStrategy; name: string; desc: string; risk: 'low' | 'medium' | 'high' | 'extreme' }[] = [
    { strategy: 'stay_course', name: 'Stay Course', desc: 'Maintain aggressive timeline with increased daily targets', risk: 'high' },
    { strategy: 'extend_timeframe', name: 'Extend Timeframe', desc: 'Add buffer days to reduce daily pressure', risk: 'low' },
    { strategy: 'reduce_risk', name: 'Reduce Risk', desc: 'Front-load smaller gains, gradually increase', risk: 'low' },
    { strategy: 'surge_recovery', name: 'Surge Recovery', desc: 'Aggressive start then normalize', risk: 'extreme' },
    { strategy: 'conservative', name: 'Conservative', desc: 'Steady small gains with safety buffer', risk: 'low' },
    { strategy: 'balanced', name: 'Balanced', desc: 'Moderate targets with built-in buffer', risk: 'medium' }
  ]
  
  // Generate all scenarios
  const scenarios: ChallengeScenario[] = strategies.map((s, i) => 
    generateScenario(
      `scenario-${i}`,
      s.name,
      s.strategy,
      s.desc,
      s.risk,
      challenge,
      currentBalance,
      riskMetrics,
      s.strategy === adjustmentType ? additionalDays : undefined
    )
  )
  
  // Find the selected scenario
  const selectedScenario = scenarios.find(s => s.strategy === adjustmentType) || scenarios[0]
  
  // Find recommended scenario (highest score)
  const recommendedScenario = scenarios.reduce((best, current) => 
    current.recommendationScore > best.recommendationScore ? current : best
  , scenarios[0])
  
  // Filter out alternative scenarios (excluding selected and recommended)
  const alternativeScenarios = scenarios.filter(s => 
    s.id !== selectedScenario.id && s.id !== recommendedScenario.id
  )
  
  // Calculate target breakdown
  const remainingProfit = challenge.targetBalance - currentBalance
  const daysRemaining = selectedScenario.dailyTargets.length
  const baseTarget = remainingProfit / daysRemaining
  const catchUpAmount = selectedScenario.avgDailyTarget - baseTarget
  const bufferAmount = remainingProfit * 0.05 // 5% buffer
  
  return {
    type: adjustmentType,
    newDailyTarget: selectedScenario.avgDailyTarget,
    newLotSize: selectedScenario.requiredLotSize,
    daysRemaining: selectedScenario.dailyTargets.length,
    canComplete: selectedScenario.successProbability > 20, // Arbitrary threshold
    message: generateAdjustmentMessage(selectedScenario, adjustmentType, challenge),
    riskMetrics,
    monteCarlo: selectedScenario.monteCarlo,
    alternativeScenarios: alternativeScenarios.slice(0, 3),
    recommendedScenario,
    targetBreakdown: {
      baseTarget,
      catchUpAmount: Math.max(0, catchUpAmount),
      bufferAmount,
      finalTarget: selectedScenario.avgDailyTarget
    }
  }
}

/**
 * Generate adjustment message
 */
function generateAdjustmentMessage(
  scenario: ChallengeScenario,
  adjustmentType: AdjustmentStrategy,
  challenge: Challenge
): string {
  const messages: Record<AdjustmentStrategy, string> = {
    'stay_course': `Staying on course requires ${scenario.avgDailyTarget.toFixed(0)} daily. You have a ${scenario.successProbability.toFixed(0)}% chance of success based on your historical performance.`,
    'extend_timeframe': `Extending by ${scenario.dailyTargets.length - (challenge.maxDays - challenge.currentDay + 1)} days reduces daily target to ${scenario.avgDailyTarget.toFixed(0)}. This gives you more breathing room with a ${scenario.successProbability.toFixed(0)}% success rate.`,
    'reduce_risk': `Reducing risk with a gradual ramp-up. Starting at ${scenario.minDailyTarget.toFixed(0)} and building to ${scenario.maxDailyTarget.toFixed(0)}. Success probability: ${scenario.successProbability.toFixed(0)}%.`,
    'surge_recovery': `Surge mode: Aggressive ${((arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)(scenario.dailyTargets.slice(0, Math.max(1, Math.ceil(scenario.dailyTargets.length * 0.3))))).toFixed(0)} daily for the first ${Math.max(1, Math.ceil(scenario.dailyTargets.length * 0.3))} days, then normalize. High risk, high reward.`,
    'conservative': `Conservative approach with a safety buffer. Steady ${scenario.avgDailyTarget.toFixed(0)} daily with 5% buffer. Lower risk but requires consistency.`,
    'balanced': `Balanced strategy with moderate targets and built-in flexibility. Aim for ${scenario.avgDailyTarget.toFixed(0)} daily with buffer days reserved for tough markets.`
  }
  
  return messages[adjustmentType] || messages['balanced']
}

/**
 * Calculate if challenge can still be completed
 */
export function canCompleteChallenge(
  challenge: Challenge,
  currentBalance: number,
  trades: Trade[]
): { possible: boolean; reason: string; bestStrategy?: AdjustmentStrategy } {
  const riskMetrics = calculateRiskMetrics(challenge, trades, currentBalance)
  
  // If drawdown is too high (>30%), unlikely to recover
  if (riskMetrics.currentDrawdownPercent > 30) {
    return { 
      possible: false, 
      reason: `Account drawdown (${riskMetrics.currentDrawdownPercent.toFixed(1)}%) exceeds safe recovery threshold. Consider restarting challenge.` 
    }
  }
  
  // If risk of ruin is too high
  if (riskMetrics.riskOfRuin > MAX_RISK_OF_RUIN) {
    return { 
      possible: false, 
      reason: `Risk of ruin (${(riskMetrics.riskOfRuin * 100).toFixed(1)}%) is too high. Account blow-up likely.` 
    }
  }
  
  // If days remaining is 0
  const daysRemaining = challenge.maxDays - challenge.currentDay + 1
  if (daysRemaining <= 0) {
    return { 
      possible: false, 
      reason: 'No days remaining. Challenge period has ended.' 
    }
  }
  
  // Test each strategy to find best one
  const strategies: AdjustmentStrategy[] = ['stay_course', 'extend_timeframe', 'reduce_risk', 'surge_recovery', 'conservative', 'balanced']
  
  let bestStrategy: AdjustmentStrategy | undefined
  let highestSuccessRate = 0
  
  for (const strategy of strategies) {
    const adjustment = calculateAdaptiveAdjustment(challenge, currentBalance, trades, strategy)
    if (adjustment.monteCarlo.probabilityOfSuccess > highestSuccessRate) {
      highestSuccessRate = adjustment.monteCarlo.probabilityOfSuccess
      bestStrategy = strategy
    }
  }
  
  // If best strategy has <10% success, probably not possible
  if (highestSuccessRate < 10) {
    return { 
      possible: false, 
      reason: `Even best strategy only has ${highestSuccessRate.toFixed(1)}% success probability. Challenge unlikely to be completed.` 
    }
  }
  
  return { 
    possible: true, 
    reason: `Challenge achievable with ${highestSuccessRate.toFixed(1)}% success probability using ${bestStrategy?.replace('_', ' ')} strategy.`,
    bestStrategy
  }
}
