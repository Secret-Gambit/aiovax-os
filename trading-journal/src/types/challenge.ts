// Challenge Engine Types

export type TradingFrequency = 'daily' | 'weekly' | 'custom'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface TradeAllocation {
  tradeNumber: number // 1st trade, 2nd trade, etc.
  maxLotSize: number // Lot size for this specific trade
  riskAmount: number // $ risk for this trade
  percentageOfDailyRisk: number // % of total daily risk
  isTaken: boolean // Whether this trade slot was used
  actualProfit?: number // Actual result
  tradeId?: string // Reference to actual trade
}

export interface ChallengeDay {
  dayNumber: number // 1, 2, 3, ...
  date: number // timestamp
  targetProfit: number // $ amount to make this day
  targetBalance: number // Balance should be at end of this day
  actualProfit: number | null // What user actually made (null if not logged)
  actualBalance: number | null // Actual balance after trades
  trades: string[] // Trade IDs logged this day
  status: 'pending' | 'passed' | 'failed' | 'extended'
  lotSize: number // Recommended lot size for this day
  notes?: string
  
  // Multi-trade allocation
  tradeAllocations?: TradeAllocation[] // Breakdown of risk per trade
  maxTradesPerDay: number // How many trades allowed
  remainingRiskBudget?: number // Risk left for the day
  
  // Weekly trading support
  isTradingDay: boolean // Is this a day the user plans to trade
  dayOfWeek: DayOfWeek // Which day of the week
}

export interface WeeklySchedule {
  enabled: boolean
  tradingDays: DayOfWeek[] // Which days of week to trade
  tradesPerWeek: number // Total trades for the week
  tradesPerTradingDay: number // Trades on each active day
  weeklyTarget: number // Target for the whole week
}

export interface AccountGrowthPlan {
  accountNumber: number // 1st account, 2nd account, etc.
  startBalance: number
  targetBalance: number
  monthlyContribution?: number // Adding fresh capital
  profitReinvestmentPercent: number // 0-100%
}

export interface Challenge {
  id: string
  name: string
  createdAt: number
  
  // Initial parameters
  startBalance: number
  targetBalance: number
  riskRewardRatio: number // e.g., 4 for 1:4
  maxDays: number
  avgStopLossPips: number // Average stop loss in pips
  
  // Calculated
  requiredDailyRate: number // The daily compound rate needed
  initialLotSize: number
  
  // Progress
  days: ChallengeDay[]
  currentDay: number // Which day user is on (1-indexed)
  
  // State
  status: 'active' | 'completed' | 'failed' | 'extended'
  totalExtensions: number // How many times extended
  
  // Adaptive recalculation history
  recalculationLog: RecalculationEvent[]
}

export interface RecalculationEvent {
  timestamp: number
  dayNumber: number
  reason: 'target_not_met' | 'target_exceeded' | 'major_drawdown' | 'user_extended'
  previousDailyRate: number
  newDailyRate: number
  previousDaysRemaining: number
  newDaysRemaining: number
  message: string
}

export interface LotSizeCalculation {
  currentBalance: number
  riskAmount: number // $ at risk per trade
  stopLossPips: number // Default 50 pips
  pipValue: number // For XAUUSD
  recommendedLotSize: number
  maxLotSize: number // Safety cap
  minLotSize: number // Broker minimum
}

// Form input for creating challenge
export interface ChallengeSetupInput {
  name: string
  startBalance: number
  targetBalance: number
  riskRewardRatio: number
  maxDays: number
  avgStopLossPips: number // For lot size calc
}

// Daily trade input
export interface DailyTradeInput {
  dayNumber: number
  profit: number // Can be negative
  trades: string[] // Reference to trade IDs
  notes?: string
}

// Enhanced Adjustment Types with new strategies
export type AdjustmentStrategy = 
  | 'stay_course'        // Linear increase, aggressive
  | 'extend_timeframe'   // Add days, maintain targets
  | 'reduce_risk'        // Lower targets, safer path
  | 'surge_recovery'     // Few high-target days, then normal
  | 'conservative'       // Steady small gains, low risk
  | 'balanced'           // Moderate adjustment with buffer

// Risk Metrics for Challenge Health
export interface ChallengeRiskMetrics {
  currentDrawdownPercent: number        // % below start balance
  distanceToTargetPercent: number       // % of total profit needed
  riskOfRuin: number                    // 0-1 probability of failure
  dailyVolatility: number               // Std dev of daily returns
  avgWinRate: number                    // Historical win rate
  avgRMultiple: number                  // Historical R per trade
  requiredWinRate: number               // Win rate needed to pass
  maxSafeLotSize: number                // Based on risk of ruin
  recommendedLotSize: number           // Optimal lot size
  riskAdjustedReturn: number           // Return per unit of risk
}

// Monte Carlo Simulation Results
export interface MonteCarloResult {
  probabilityOfSuccess: number          // 0-100%
  probabilityOfFailure: number          // 0-100%
  probabilityOfExtension: number        // 0-100%
  expectedFinalBalance: number
  bestCaseBalance: number               // 95th percentile
  worstCaseBalance: number              // 5th percentile
  medianBalance: number
  simulationsRun: number
  scenarios: MonteCarloScenario[]
}

export interface MonteCarloScenario {
  path: number[]                        // Balance each day
  finalBalance: number
  isSuccessful: boolean
  requiredExtension: boolean
  maxDrawdown: number
}

// Challenge Scenario for Comparison
export interface ChallengeScenario {
  id: string
  name: string
  strategy: AdjustmentStrategy
  description: string
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  
  // Projections
  dailyTargets: number[]                 // Target for each remaining day
  projectedPath: number[]                // Expected balance path
  
  // Metrics
  successProbability: number            // From Monte Carlo
  avgDailyTarget: number
  maxDailyTarget: number
  minDailyTarget: number
  requiredLotSize: number
  totalRiskAmount: number               // Sum of daily risk
  timeToCompletion: number              // Expected days
  
  // Risk Assessment
  riskMetrics: ChallengeRiskMetrics
  monteCarlo: MonteCarloResult
  
  // Recommendation Score 0-100
  recommendationScore: number
  reasoning: string[]
}

// Enhanced Adaptive adjustment response
export interface AdaptiveAdjustment {
  type: AdjustmentStrategy
  newDailyTarget: number
  newLotSize: number
  daysRemaining: number
  canComplete: boolean
  message: string
  
  // Enhanced fields
  riskMetrics: ChallengeRiskMetrics
  monteCarlo: MonteCarloResult
  alternativeScenarios: ChallengeScenario[]
  recommendedScenario: ChallengeScenario
  
  // Detailed breakdown
  targetBreakdown: {
    baseTarget: number
    catchUpAmount: number
    bufferAmount: number
    finalTarget: number
  }
}
