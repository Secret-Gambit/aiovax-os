import { useState } from 'react'
import type { Trade } from '../types/trade'
import type { DisciplineAlert } from '../hooks/useTrades'
import type { WeeklyGoal } from '../hooks/useWeeklyGoals'
import { Flame, Snowflake, AlertTriangle, AlertOctagon, TrendingUp, TrendingDown, Plus, Target, Trophy, X } from 'lucide-react'
import { StreakVisualizer } from './visualizations'

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
          className="w-full py-4 rounded-2xl gold-accent font-bold text-lg tap-target touch-manipulation cursor-pointer transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-[var(--gold-glow)] active:scale-[0.96] flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          <span>LOG NEW TRADE</span>
        </button>
      </div>

      {/* Stats Section */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pb-4">
        
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Net R Card */}
          <div className="phone-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${today.netR >= 0 ? 'bg-[var(--profit-soft)]' : 'bg-[var(--loss-soft)]'}`}>
                <TrendingUp size={16} className={today.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'} />
              </div>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Net R</span>
            </div>
            <p className={`text-2xl font-bold ${today.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
              {today.netR >= 0 ? '+' : ''}{today.netR.toFixed(2)}R
            </p>
          </div>

          {/* Trades Count Card */}
          <div className="phone-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
                <Flame size={16} className="text-[var(--gold-primary)]" />
              </div>
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Trades</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{today.count}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              <span className="text-[var(--profit)]">{today.wins}W</span> / <span className="text-[var(--loss)]">{today.losses}L</span>
            </p>
          </div>
        </div>

        {/* Streak Visualizer */}
        <StreakVisualizer streak={today.streak} streakType={today.streakType} />

        {/* Recent Trades Section */}
        {todayTrades.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Today&apos;s Trades</p>
              <span className="text-xs text-[var(--text-muted)]">{todayTrades.length} total</span>
            </div>
            <div className="space-y-2">
              {todayTrades.slice(0, 5).map((trade) => (
                <div
                  key={trade.id}
                  className="phone-card p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      trade.result === 'Win' ? 'bg-[var(--profit-soft)]' : 
                      trade.result === 'Loss' ? 'bg-[var(--loss-soft)]' : 'bg-[var(--bg-tertiary)]'
                    }`}>
                      {trade.direction === 'buy' ? (
                        <TrendingUp size={18} className={trade.result === 'Win' ? 'text-[var(--profit)]' : trade.result === 'Loss' ? 'text-[var(--loss)]' : 'text-[var(--text-muted)]'} />
                      ) : (
                        <TrendingDown size={18} className={trade.result === 'Win' ? 'text-[var(--profit)]' : trade.result === 'Loss' ? 'text-[var(--loss)]' : 'text-[var(--text-muted)]'} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{trade.setup[0] || 'Trade'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{trade.entryTrigger} • {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trade.result === 'Win' ? 'bg-[var(--profit-soft)] text-[var(--profit)]' : 
                      trade.result === 'Loss' ? 'bg-[var(--loss-soft)] text-[var(--loss)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                      {trade.result}
                    </span>
                    <span className={`text-sm font-bold ${trade.result === 'Win' ? 'text-[var(--profit)]' : trade.result === 'Loss' ? 'text-[var(--loss)]' : 'text-[var(--text-muted)]'}`}>
                      {trade.result === 'Win' ? '+' : trade.result === 'Loss' ? '-' : ''}{Math.abs(trade.rMultiple).toFixed(1)}R
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todayTrades.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-3">
              <Plus size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-1">No trades today</p>
            <p className="text-xs text-[var(--text-muted)]">Tap &quot;Log New Trade&quot; to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
