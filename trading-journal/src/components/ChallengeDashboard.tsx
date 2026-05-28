import { useState } from 'react'
import type { Challenge, ChallengeDay, AdaptiveAdjustment } from '../types/challenge'
import { Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign, ChevronRight, RotateCcw, Trash2, BarChart3 } from 'lucide-react'
import { ChallengeProgressWheel } from './visualizations'

interface ChallengeDashboardProps {
  challenge: Challenge
  progressStats: {
    currentBalance: number
    totalProfit: number
    progressPercent: number
    daysCompleted: number
    daysPassed: number
    daysFailed: number
    daysExtended: number
    daysRemaining: number
    isOnTrack: boolean
  } | null
  currentDayData: ChallengeDay | null
  onLogDay: (dayNumber: number, profit: number) => void
  onRecalculate: (dayNumber: number, profit: number, adjustment: 'stay' | 'extend' | 'reduce_risk', additionalDays?: number) => AdaptiveAdjustment
  onDelete: () => void
}

export function ChallengeDashboard({
  challenge,
  progressStats,
  currentDayData,
  onLogDay,
  onRecalculate,
  onDelete
}: ChallengeDashboardProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [dailyProfit, setDailyProfit] = useState('')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustment, setAdjustment] = useState<'stay' | 'extend' | 'reduce_risk'>('stay')
  const [additionalDays, setAdditionalDays] = useState(7)
  const [adjustmentResult, setAdjustmentResult] = useState<AdaptiveAdjustment | null>(null)

  if (!progressStats || !currentDayData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p style={{ color: 'var(--text-muted)' }}>Loading challenge data...</p>
      </div>
    )
  }

  const handleLogDay = () => {
    const profit = parseFloat(dailyProfit)
    if (isNaN(profit)) return

    const day = challenge.days.find(d => d.dayNumber === (selectedDay || challenge.currentDay))
    if (!day) return

    // Check if target was met, exceeded, or missed
    if (profit < day.targetProfit && progressStats.currentBalance + profit >= challenge.startBalance * 0.5) {
      // Missed target but not major drawdown - show adjustment options
      setShowAdjustmentModal(true)
      setAdjustmentResult(null)
    } else {
      // Target met, exceeded, or major drawdown - proceed with auto logic
      const result = onRecalculate(day.dayNumber, profit, 
        profit >= day.targetProfit * 1.5 ? 'reduce_risk' : 
        profit >= day.targetProfit ? 'stay' : 'extend',
        profit < day.targetProfit && progressStats.currentBalance + profit < challenge.startBalance * 0.5 ? 14 : undefined
      )
      setAdjustmentResult(result)
      setShowAdjustmentModal(true)
    }
    
    setShowLogModal(false)
  }

  const handleAdjustmentConfirm = () => {
    const profit = parseFloat(dailyProfit)
    const day = challenge.days.find(d => d.dayNumber === (selectedDay || challenge.currentDay))
    if (!day) return

    const result = onRecalculate(day.dayNumber, profit, adjustment, adjustment === 'extend' ? additionalDays : undefined)
    setAdjustmentResult(result)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${amount.toFixed(0)}`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{challenge.name}</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Day {challenge.currentDay} of {challenge.maxDays}
            </p>
          </div>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg tap-target"
            style={{ color: 'var(--loss)' }}
            title="Delete challenge"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Challenge Progress Wheel */}
        <ChallengeProgressWheel challenge={challenge} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="phone-card rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} style={{ color: 'var(--profit)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Current</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(progressStats.currentBalance)}</p>
          </div>
          
          <div className="phone-card rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} style={{ color: progressStats.totalProfit >= 0 ? 'var(--profit)' : 'var(--loss)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Profit</span>
            </div>
            <p className={`text-xl font-bold ${progressStats.totalProfit >= 0 ? 'status-profit' : 'status-loss'}`}>
              {progressStats.totalProfit >= 0 ? '+' : ''}{formatCurrency(progressStats.totalProfit)}
            </p>
          </div>
          
          <div className="phone-card rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} style={{ color: 'var(--profit)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Days Passed</span>
            </div>
            <p className="text-xl font-bold status-profit">{progressStats.daysPassed}</p>
          </div>
          
          <div className="phone-card rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Remaining</span>
            </div>
            <p className="text-xl font-bold">{progressStats.daysRemaining}</p>
          </div>
        </div>

        {/* Today's Target */}
        <div className="phone-card rounded-2xl p-4 border-2" style={{ borderColor: 'var(--gold-primary)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="gold-text" />
              <span className="font-semibold">Today's Target</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full gold-accent">
              Day {currentDayData.dayNumber}
            </span>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-4xl font-bold gold-text mb-1">
              +${currentDayData.targetProfit.toFixed(2)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Target Balance: ${currentDayData.targetBalance.toFixed(2)}
            </p>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg mb-4" style={{ background: 'var(--bg-tertiary)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Recommended Lot Size</span>
            <span className="text-lg font-bold gold-text">{currentDayData.lotSize.toFixed(2)}</span>
          </div>
          
          <button
            onClick={() => {
              setSelectedDay(null)
              setDailyProfit('')
              setShowLogModal(true)
            }}
            className="w-full py-3 rounded-xl gold-accent font-semibold tap-target flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Log Today's Result
          </button>
        </div>

        {/* Calendar Preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Upcoming Days</h3>
            <button 
              className="text-xs gold-text"
              onClick={() => setSelectedDay(challenge.currentDay + 1)}
            >
              View All
            </button>
          </div>
          
          <div className="space-y-2">
            {challenge.days.slice(challenge.currentDay - 1, challenge.currentDay + 4).map((day) => (
              <div 
                key={day.dayNumber}
                className={`phone-card rounded-xl p-3 flex items-center justify-between ${
                  day.dayNumber === challenge.currentDay ? 'border border-[var(--gold-primary)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ 
                      background: day.dayNumber === challenge.currentDay ? 'var(--gold-primary)' : 'var(--bg-tertiary)',
                      color: day.dayNumber === challenge.currentDay ? '#0a0a0a' : 'var(--text-primary)'
                    }}
                  >
                    {day.dayNumber}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {day.dayNumber === challenge.currentDay ? 'Today' : `Day ${day.dayNumber}`}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Target: +${day.targetProfit.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                {day.status === 'pending' && day.dayNumber === challenge.currentDay && (
                  <button
                    onClick={() => {
                      setSelectedDay(day.dayNumber)
                      setDailyProfit('')
                      setShowLogModal(true)
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs gold-accent tap-target"
                  >
                    Log
                  </button>
                )}
                
                {day.status === 'passed' && <CheckCircle size={18} className="status-profit" />}
                {day.status === 'failed' && <XCircle size={18} className="status-loss" />}
                {day.status === 'extended' && <RotateCcw size={18} style={{ color: 'var(--warning)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Recalculation History */}
        {challenge.recalculationLog.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Adaptation History</h3>
            <div className="space-y-2">
              {challenge.recalculationLog.slice(-3).map((log, index) => (
                <div key={index} className="phone-card rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
                    <span className="text-sm font-medium">Day {log.dayNumber} Adjustment</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Log Day Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="phone-card rounded-2xl p-5 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Log Day {selectedDay || challenge.currentDay}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  DAILY PROFIT/LOSS ($)
                </label>
                <input
                  type="number"
                  value={dailyProfit}
                  onChange={(e) => setDailyProfit(e.target.value)}
                  placeholder="Enter amount (negative for loss)"
                  className="w-full bg-transparent text-2xl font-bold outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 rounded-xl font-semibold tap-target phone-card"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogDay}
                  disabled={!dailyProfit}
                  className={`flex-1 py-3 rounded-xl font-semibold tap-target ${
                    dailyProfit ? 'gold-accent' : 'phone-card select-inactive'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && !adjustmentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="phone-card rounded-2xl p-5 w-full max-w-sm">
            <div className="text-center mb-4">
              <AlertTriangle size={40} className="mx-auto mb-2" style={{ color: 'var(--warning)' }} />
              <h3 className="text-lg font-bold">Target Not Met</h3>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                You didn't hit today's target. How would you like to proceed?
              </p>
            </div>
            
            <div className="space-y-3 mb-4">
              <button
                onClick={() => setAdjustment('stay')}
                className={`w-full p-4 rounded-xl text-left tap-target ${
                  adjustment === 'stay' ? 'gold-accent' : 'phone-card'
                }`}
              >
                <p className="font-semibold">Stay on Timeline</p>
                <p className="text-xs mt-1 opacity-80">
                  Increase daily targets for remaining days
                </p>
              </button>
              
              <button
                onClick={() => setAdjustment('extend')}
                className={`w-full p-4 rounded-xl text-left tap-target ${
                  adjustment === 'extend' ? 'gold-accent' : 'phone-card'
                }`}
              >
                <p className="font-semibold">Extend Timeframe</p>
                <p className="text-xs mt-1 opacity-80">
                  Add more days to reduce daily pressure
                </p>
              </button>
            </div>
            
            {adjustment === 'extend' && (
              <div className="mb-4">
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  ADDITIONAL DAYS
                </label>
                <div className="flex gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setAdditionalDays(days)}
                      className={`flex-1 py-2 rounded-lg text-sm tap-target ${
                        additionalDays === days ? 'gold-accent' : 'bg-white/5'
                      }`}
                    >
                      +{days}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold tap-target phone-card"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustmentConfirm}
                className="flex-1 py-3 rounded-xl font-semibold tap-target gold-accent"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal - Enhanced with Risk Metrics & Monte Carlo */}
      {showAdjustmentModal && adjustmentResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="phone-card rounded-2xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <CheckCircle size={48} className="mx-auto mb-4 status-profit" />
              <h3 className="text-lg font-bold mb-2">Plan Updated!</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {adjustmentResult.message}
              </p>
            </div>
            
            {/* Success Probability Gauge */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Success Probability</span>
                <span className={`text-lg font-bold ${
                  adjustmentResult.monteCarlo.probabilityOfSuccess > 70 ? 'status-profit' :
                  adjustmentResult.monteCarlo.probabilityOfSuccess > 40 ? 'status-neutral' :
                  'status-loss'
                }`}>
                  {adjustmentResult.monteCarlo.probabilityOfSuccess.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div 
                  className={`h-full rounded-full transition-all ${
                    adjustmentResult.monteCarlo.probabilityOfSuccess > 70 ? 'bg-green-500' :
                    adjustmentResult.monteCarlo.probabilityOfSuccess > 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${adjustmentResult.monteCarlo.probabilityOfSuccess}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Fail {adjustmentResult.monteCarlo.probabilityOfFailure.toFixed(0)}%</span>
                <span>Extend {adjustmentResult.monteCarlo.probabilityOfExtension.toFixed(0)}%</span>
              </div>
            </div>
            
            {/* Target Breakdown */}
            {adjustmentResult.targetBreakdown && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Target Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Target</span>
                    <span>${adjustmentResult.targetBreakdown.baseTarget.toFixed(0)}</span>
                  </div>
                  {adjustmentResult.targetBreakdown.catchUpAmount > 0 && (
                    <div className="flex justify-between text-[var(--gold-primary)]">
                      <span>Catch Up</span>
                      <span>+${adjustmentResult.targetBreakdown.catchUpAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Buffer</span>
                    <span>${adjustmentResult.targetBreakdown.bufferAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-[var(--border-soft)]">
                    <span>Final Target</span>
                    <span>${adjustmentResult.targetBreakdown.finalTarget.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Risk Metrics */}
            {adjustmentResult.riskMetrics && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Risk Assessment</p>
                <div className="space-y-1 text-sm">
                  {adjustmentResult.riskMetrics.currentDrawdownPercent > 0 && (
                    <div className="flex justify-between">
                      <span>Drawdown</span>
                      <span className="status-loss">-{adjustmentResult.riskMetrics.currentDrawdownPercent.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Historical Win Rate</span>
                    <span>{(adjustmentResult.riskMetrics.avgWinRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg R per Trade</span>
                    <span>{adjustmentResult.riskMetrics.avgRMultiple.toFixed(2)}R</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk of Ruin</span>
                    <span className={adjustmentResult.riskMetrics.riskOfRuin > 0.3 ? 'status-loss' : 'status-profit'}>
                      {(adjustmentResult.riskMetrics.riskOfRuin * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>New Daily Target</span>
                <span className="font-semibold">+${adjustmentResult.newDailyTarget.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>New Lot Size</span>
                <span className="font-semibold gold-text">{adjustmentResult.newLotSize.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Days Remaining</span>
                <span className="font-semibold">{adjustmentResult.daysRemaining}</span>
              </div>
            </div>
            
            {/* Recommended Scenario Note */}
            {adjustmentResult.recommendedScenario && adjustmentResult.recommendedScenario.id !== 'scenario-0' && (
              <div className="mb-4 p-3 rounded-xl border border-[var(--gold-primary)]/30 bg-[var(--gold-primary)]/5">
                <p className="text-sm font-semibold mb-1 flex items-center gap-1">
                  <Target size={14} className="text-[var(--gold-primary)]" />
                  Recommended Strategy
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Consider "{adjustmentResult.recommendedScenario.name}" for {adjustmentResult.recommendedScenario.successProbability.toFixed(0)}% success rate
                </p>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowAdjustmentModal(false)
                setAdjustmentResult(null)
                setDailyProfit('')
              }}
              className="w-full py-3 rounded-xl font-semibold tap-target gold-accent"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
