import { useState } from 'react'
import type { Trade } from '../types/trade'
import type { DisciplineAlert } from '../hooks/useTrades'
import type { WeeklyGoal } from '../hooks/useWeeklyGoals'
import { Flame, Snowflake, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown, Plus, Target, Trophy, X } from 'lucide-react'

interface HomeDashboardProps {
  stats: {
    today: {
      count: number
      wins: number
      losses: number
      breakevens: number
      netR: number
      streak: number
      streakType: 'win' | 'loss' | null
    }
  }
  disciplineAlerts: DisciplineAlert[]
  onStartNewTrade: () => void
  todayTrades: Trade[]
  weeklyGoal?: WeeklyGoal | null
  shouldShowGoalPrompt?: boolean
  onSetWeeklyGoal?: (targetR: number) => void
  weeklyProgress?: number
  isWeeklyGoalReached?: boolean
}

export function HomeDashboard({
  stats,
  disciplineAlerts,
  onStartNewTrade,
  todayTrades,
  weeklyGoal,
  shouldShowGoalPrompt,
  onSetWeeklyGoal,
  weeklyProgress = 0,
  isWeeklyGoalReached = false
}: HomeDashboardProps) {
  const { today } = stats
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [customGoal, setCustomGoal] = useState('')

  const streakIcon = today.streak > 0
    ? <Flame size={16} className="inline" style={{ color: 'var(--profit)' }} />
    : today.streak < 0
      ? <Snowflake size={16} className="inline" style={{ color: 'var(--loss)' }} />
      : null

  const handleSetGoal = (target: number) => {
    onSetWeeklyGoal?.(target)
    setShowGoalModal(false)
  }

  const handleCustomGoal = () => {
    const target = parseFloat(customGoal)
    if (target > 0) {
      handleSetGoal(target)
    }
  }

  return (
    <div className="flex flex-col h-full px-5">
      {/* Weekly Goal Modal / Prompt */}
      {(shouldShowGoalPrompt || showGoalModal) && onSetWeeklyGoal && (
        <div className="flex-none py-3">
          {shouldShowGoalPrompt && !showGoalModal ? (
            // Compact prompt
            <div className="phone-card rounded-xl p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="gold-text" />
                <span className="font-semibold text-sm">Set Weekly R Goal</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                New week! What&apos;s your target?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSetGoal(3)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium tap-target gold-accent"
                >
                  +3R
                </button>
                <button
                  onClick={() => handleSetGoal(5)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium tap-target gold-accent"
                >
                  +5R
                </button>
                <button
                  onClick={() => handleSetGoal(10)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium tap-target gold-accent"
                >
                  +10R
                </button>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="px-3 py-2 rounded-lg text-xs tap-target"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                >
                  Custom
                </button>
              </div>
            </div>
          ) : showGoalModal ? (
            // Full modal
            <div className="phone-card rounded-xl p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={18} className="gold-text" />
                  <span className="font-semibold text-sm">Set Weekly Goal</span>
                </div>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="p-1 rounded tap-target"
                  style={{ color: 'var(--text-muted)' }}
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="Target R..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border"
                  style={{ borderColor: 'var(--border-soft)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <button
                  onClick={handleCustomGoal}
                  disabled={!customGoal || parseFloat(customGoal) <= 0}
                  className="px-4 py-2 rounded-lg text-sm tap-target gold-accent disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Weekly Goal Progress */}
      {weeklyGoal && !shouldShowGoalPrompt && (
        <div className="flex-none py-2">
          <div className={`phone-card rounded-xl p-3 ${isWeeklyGoalReached ? 'gold-accent' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isWeeklyGoalReached ? <Trophy size={16} /> : <Target size={16} className="gold-text" />}
                <span className={`font-semibold text-sm ${isWeeklyGoalReached ? '' : 'gold-text'}`}>
                  {isWeeklyGoalReached ? 'Goal Reached!' : 'Weekly Goal'}
                </span>
              </div>
              <span className="text-sm font-bold">
                {weeklyGoal.currentR >= 0 ? '+' : ''}{weeklyGoal.currentR.toFixed(1)}R / +{weeklyGoal.targetR}R
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, weeklyProgress)}%`,
                  background: isWeeklyGoalReached ? 'var(--profit)' : 'var(--gold-primary)'
                }}
              />
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
              {isWeeklyGoalReached 
                ? 'Take the rest of the week off! 🎉' 
                : `${(100 - weeklyProgress).toFixed(0)}% to goal`}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {disciplineAlerts.length > 0 && (
        <div className="flex-none pt-2 pb-3 space-y-2">
          {disciplineAlerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl animate-slide-up"
              style={{
                background: alert.severity === 'danger' ? 'var(--loss-soft)' : 'rgba(251, 191, 36, 0.1)',
                border: `1px solid ${alert.severity === 'danger' ? 'var(--loss)' : 'rgba(251, 191, 36, 0.3)'}`
              }}
            >
              <div className="flex items-center gap-3">
                {alert.severity === 'danger' ? <AlertOctagon size={20} style={{ color: 'var(--loss)' }} /> : <AlertTriangle size={20} style={{ color: '#fbbf24' }} />}
                <div className="flex-1">
                  <p className="text-xs font-semibold" style={{ color: alert.severity === 'danger' ? 'var(--loss)' : '#fbbf24' }}>
                    {alert.type === 'stop-signal' ? 'STOP' : alert.type === 'revenge' ? 'REVENGE' : 'WARNING'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Action Button */}
      <div className="flex-none py-3">
        <button
          onClick={onStartNewTrade}
          className="w-full py-5 rounded-2xl gold-accent font-bold text-lg tap-target touch-manipulation active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          <span>NEW TRADE</span>
        </button>
      </div>

      {/* Stats */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pb-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="phone-card p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Trades</p>
            <p className="text-3xl font-bold">{today.count}</p>
          </div>
          <div className="phone-card p-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Net R</p>
            <p className={`text-3xl font-bold ${today.netR >= 0 ? 'status-profit' : 'status-loss'}`}>
              {today.netR >= 0 ? '+' : ''}{today.netR.toFixed(1)}R
            </p>
          </div>
        </div>

        {/* Win/Loss/BE */}
        <div className="grid grid-cols-3 gap-2">
          <div className="phone-card p-3 text-center">
            <p className="text-xs" style={{ color: 'var(--profit)' }}>W</p>
            <p className="text-xl font-semibold">{today.wins}</p>
          </div>
          <div className="phone-card p-3 text-center">
            <p className="text-xs" style={{ color: 'var(--loss)' }}>L</p>
            <p className="text-xl font-semibold">{today.losses}</p>
          </div>
          <div className="phone-card p-3 text-center">
            <p className="text-xs" style={{ color: 'var(--neutral)' }}>BE</p>
            <p className="text-xl font-semibold">{today.breakevens}</p>
          </div>
        </div>

        {/* Streak */}
        <div className="phone-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Streak</p>
            <p className={`text-lg font-semibold ${today.streak > 0 ? 'status-profit' : today.streak < 0 ? 'status-loss' : ''}`}>
              {today.streak !== 0 && <span className="mr-1">{streakIcon}</span>}{Math.abs(today.streak)}{today.streak > 0 ? 'W' : today.streak < 0 ? 'L' : ''}
            </p>
          </div>
          {streakIcon || <span>—</span>}
        </div>

        {/* Recent Trades */}
        {todayTrades.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2 gold-text">TODAY</p>
            <div className="space-y-2">
              {todayTrades.slice(0, 5).map((trade) => (
                <div
                  key={trade.id}
                  className="phone-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {trade.direction === 'buy' ? <TrendingUp size={18} style={{ color: 'var(--profit)' }} /> : <TrendingDown size={18} style={{ color: 'var(--loss)' }} />}
                    <div>
                      <p className="text-sm font-medium">{trade.setup[0] || 'Trade'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{trade.entryTrigger}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${trade.result === 'Win' ? 'status-profit' : trade.result === 'Loss' ? 'status-loss' : ''}`}>
                    {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
