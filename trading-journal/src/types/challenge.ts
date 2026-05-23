// Challenge Engine Types

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

// Adaptive adjustment response
export interface AdaptiveAdjustment {
  type: 'stay_course' | 'extend_timeframe' | 'reduce_risk'
  newDailyTarget: number
  newLotSize: number
  daysRemaining: number
  canComplete: boolean // Is it still mathematically possible?
  message: string
}
