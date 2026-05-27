export type Direction = 'buy' | 'sell'

export type SetupType = 'FVG' | 'Order Block' | 'Liquidity Sweep' | 'Imbalance Gap' | 'Break of Structure' | 'Other'

export type EntryTrigger = 
  | 'Engulfing Candle' 
  | '50% Candle Reaction' 
  | 'Indecision → Momentum Candle' 
  | 'Break & Retest' 
  | 'Late Entry'

export type MarketContext = 'Trending' | 'Ranging' | 'News Impact' | 'Not Sure'

export type Emotion = 
  | 'Calm' 
  | 'Confident' 
  | 'Impatient' 
  | 'Fearful' 
  | 'Revenge Trading' 
  | 'Overtrading Urge'

export type Result = 'Win' | 'Loss' | 'Breakeven'

export interface Trade {
  id: string
  timestamp: number
  entryTime?: string // HH:MM format for trade entry time (local time)
  timezoneOffset?: number // Timezone offset in minutes from UTC (e.g., +180 for UTC+3, -300 for UTC-5)
  direction: Direction
  setup: SetupType[]
  entryTrigger: EntryTrigger
  marketContext: MarketContext
  emotion: Emotion
  result: Result
  rMultiple: number
  notes?: string
  image?: string // base64 compressed image
}

export const SETUP_OPTIONS: SetupType[] = [
  'FVG',
  'Order Block',
  'Liquidity Sweep',
  'Imbalance Gap',
  'Break of Structure',
  'Other',
]

export const ENTRY_TRIGGERS: EntryTrigger[] = [
  'Engulfing Candle',
  '50% Candle Reaction',
  'Indecision → Momentum Candle',
  'Break & Retest',
  'Late Entry',
]

export const MARKET_CONTEXTS: MarketContext[] = [
  'Trending',
  'Ranging',
  'News Impact',
  'Not Sure',
]

export const EMOTIONS: Emotion[] = [
  'Calm',
  'Confident',
  'Impatient',
  'Fearful',
  'Revenge Trading',
  'Overtrading Urge',
]

export const RESULTS: Result[] = ['Win', 'Loss', 'Breakeven']

export const SNAP_POINTS = [-2, -1, 0, 1, 2, 3]

export const isEmotionalTrade = (emotion: Emotion): boolean => {
  return emotion === 'Impatient' || emotion === 'Revenge Trading' || emotion === 'Overtrading Urge'
}

export const isRevengeTrade = (emotion: Emotion): boolean => {
  return emotion === 'Revenge Trading'
}

// Template for quick trade pre-fill
export interface TradeTemplate {
  id: string
  name: string
  direction: Direction
  setup: SetupType[]
  entryTrigger: EntryTrigger
  marketContext: MarketContext
  emotion: Emotion
  entryTime?: string
  timezoneOffset?: number
}
