import { useState } from 'react'
import type { Trade } from '../types/trade'
import type { SessionStats, HourlyPerformance } from '../utils/sessionAnalytics'
import { TrendingUp, TrendingDown, Zap, BarChart3, Play, X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle, Smile, Frown, AlertTriangle, Flame, Meh, Calendar, Clock } from 'lucide-react'
import { Calendar as CalendarComponent } from './Calendar'
import { RMHistogram, SetupPerformanceBars, DailyHeatStrip, WinRateGauge, DisciplineScoreRing, SetupTrends } from './visualizations'
import { SessionPerformance } from './SessionPerformance'

interface InsightsProps {
  stats: {
    allTime: {
      totalTrades: number
      winRate: number
      netR: number
      avgR: number
      bestSetup: string | null
      worstSetup: string | null
      emotionalTrades: number
      calmTrades: number
      revengeTrades: number
      pctEmotional: number
      pctCalm: number
      emotionalWinRate: number
      calmWinRate: number
    }
    today: {
      streak: number
      streakType: 'win' | 'loss' | null
    }
  }
  todayTrades: Trade[]
  allTimeTrades: Trade[]
  deleteTrade: (id: string) => void
  sessionStats?: SessionStats[]
  hourlyPerformance?: HourlyPerformance[]
}

export function Insights({ stats, todayTrades, allTimeTrades, deleteTrade, sessionStats = [], hourlyPerformance = [] }: InsightsProps) {
  const [showReplay, setShowReplay] = useState(false)
  const [replayIndex, setReplayIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'insights' | 'calendar' | 'sessions'>('insights')

  const { allTime } = stats

  const setupPerformance = () => {
    const setupStats = new Map<string, { trades: number; wins: number; netR: number }>()

    allTimeTrades.forEach(t => {
      t.setup.forEach(s => {
        const current = setupStats.get(s) || { trades: 0, wins: 0, netR: 0 }
        current.trades++
        if (t.result === 'Win') {
          current.wins++
          current.netR += t.rMultiple
        } else if (t.result === 'Loss') {
          current.netR -= Math.abs(t.rMultiple)
        }
        setupStats.set(s, current)
      })
    })

    return Array.from(setupStats.entries())
      .map(([name, s]) => ({
        name,
        ...s,
        winRate: s.trades > 0 ? (s.wins / s.trades) * 100 : 0,
      }))
      .sort((a, b) => b.netR - a.netR)
  }

  const emotionPerformance = () => {
    const emotionStats = new Map<string, { trades: number; wins: number }>()

    allTimeTrades.forEach(t => {
      const current = emotionStats.get(t.emotion) || { trades: 0, wins: 0 }
      current.trades++
      if (t.result === 'Win') current.wins++
      emotionStats.set(t.emotion, current)
    })

    return Array.from(emotionStats.entries())
      .map(([name, s]) => ({
        name,
        ...s,
        winRate: s.trades > 0 ? (s.wins / s.trades) * 100 : 0,
      }))
      .sort((a, b) => b.trades - a.trades)
  }

  const instrumentPerformance = () => {
    const instrumentStats = new Map<string, { trades: number; wins: number; netR: number }>()

    allTimeTrades.forEach(t => {
      const inst = t.instrument || 'XAUUSD'
      const current = instrumentStats.get(inst) || { trades: 0, wins: 0, netR: 0 }
      current.trades++
      if (t.result === 'Win') {
        current.wins++
        current.netR += t.rMultiple
      } else if (t.result === 'Loss') {
        current.netR -= Math.abs(t.rMultiple)
      }
      instrumentStats.set(inst, current)
    })

    return Array.from(instrumentStats.entries())
      .map(([name, s]) => ({
        name,
        ...s,
        winRate: s.trades > 0 ? (s.wins / s.trades) * 100 : 0,
      }))
      .sort((a, b) => b.netR - a.netR)
  }

  const handleReplay = () => {
    setShowReplay(true)
    setReplayIndex(0)
  }

  const handleNextReplay = () => {
    if (replayIndex < todayTrades.length - 1) {
      setReplayIndex(prev => prev + 1)
    } else {
      setShowReplay(false)
    }
  }

  const handlePrevReplay = () => {
    if (replayIndex > 0) {
      setReplayIndex(prev => prev - 1)
    }
  }

  // Emotion icon helper
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'Calm': return <Meh size={24} style={{ color: 'var(--profit)' }} />
      case 'Confident': return <Smile size={24} style={{ color: 'var(--profit)' }} />
      case 'Fearful': return <Frown size={24} style={{ color: 'var(--loss)' }} />
      case 'Revenge Trading': return <Flame size={24} style={{ color: 'var(--loss)' }} />
      case 'Overtrading Urge': return <AlertTriangle size={24} style={{ color: '#fbbf24' }} />
      default: return <Meh size={24} style={{ color: 'var(--neutral)' }} />
    }
  }

  // Result icon helper
  const getResultIcon = (result: string) => {
    switch (result) {
      case 'Win': return <CheckCircle2 size={32} style={{ color: 'var(--profit)' }} />
      case 'Loss': return <XCircle size={32} style={{ color: 'var(--loss)' }} />
      default: return <MinusCircle size={32} style={{ color: 'var(--neutral)' }} />
    }
  }

  if (showReplay && todayTrades.length > 0) {
    const trade = todayTrades[replayIndex]
    return (
      <div className="flex flex-col h-full px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Play size={20} className="gold-text" />
            <h2 className="text-lg font-bold">Replay Today</h2>
          </div>
          <button
            onClick={() => setShowReplay(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center tap-target touch-manipulation"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Trade {replayIndex + 1} of {todayTrades.length}
        </p>

        {/* Trade Card */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="phone-card p-5 w-full space-y-4">
            {/* Time */}
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Direction */}
            <div className="text-center pb-4 border-b border-white/10">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Direction</p>
              <div className="flex items-center justify-center gap-2">
                {trade.direction === 'buy' ? (
                  <TrendingUp size={28} style={{ color: 'var(--profit)' }} />
                ) : (
                  <TrendingDown size={28} style={{ color: 'var(--loss)' }} />
                )}
                <span className="text-2xl font-bold">{trade.direction.toUpperCase()}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{trade.setup.join(', ')}</p>
            </div>

            {/* Emotion */}
            <div className="text-center pb-4 border-b border-white/10">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Emotion</p>
              <div className="flex flex-col items-center gap-1">
                {getEmotionIcon(trade.emotion)}
                <p className={`font-semibold ${
                  (trade.emotion === 'Revenge Trading' || trade.emotion === 'Overtrading Urge')
                    ? 'status-loss'
                    : trade.emotion === 'Calm' || trade.emotion === 'Confident'
                      ? 'status-profit'
                      : ''
                }`}>
                  {trade.emotion}
                </p>
              </div>
            </div>

            {/* Result */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Result</p>
              <div className="flex items-center justify-center gap-2">
                {getResultIcon(trade.result)}
                <span className={`text-3xl font-bold ${
                  trade.result === 'Win' ? 'status-profit' : trade.result === 'Loss' ? 'status-loss' : ''
                }`}>
                  {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handlePrevReplay}
            disabled={replayIndex === 0}
            className={`px-4 py-3 rounded-xl font-medium tap-target touch-manipulation flex items-center gap-1 ${
              replayIndex === 0
                ? 'cursor-not-allowed'
                : ''
            }`}
            style={{
              background: replayIndex === 0 ? 'var(--bg-tertiary)' : 'var(--bg-card)',
              color: replayIndex === 0 ? 'var(--text-muted)' : 'var(--text-primary)'
            }}
          >
            <ChevronLeft size={18} />
            Prev
          </button>

          {/* Dots */}
          <div className="flex gap-1">
            {todayTrades.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: i === replayIndex ? 'var(--gold-primary)' : 'var(--bg-tertiary)' }}
              />
            ))}
          </div>

          <button
            onClick={handleNextReplay}
            className="px-4 py-3 rounded-xl font-medium tap-target touch-manipulation flex items-center gap-1 gold-accent"
          >
            {replayIndex === todayTrades.length - 1 ? 'Done' : 'Next'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  if (allTimeTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="phone-card rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl gold-accent flex items-center justify-center mx-auto mb-6">
            <BarChart3 size={32} />
          </div>
          <h2 className="text-xl font-bold mb-3">No Data Yet</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Log your first trade to see insights
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Analytics will appear here
          </p>
        </div>
      </div>
    )
  }

  const setups = setupPerformance()
  const emotions = emotionPerformance()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex-none px-5 pt-4 pb-2">
        <div className="flex rounded-xl overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-2.5 text-sm font-medium tap-target transition-all flex items-center justify-center gap-2 ${
              activeTab === 'insights' ? 'gold-accent' : ''
            }`}
            style={{ color: activeTab === 'insights' ? undefined : 'var(--text-muted)' }}
          >
            <BarChart3 size={16} />
            Insights
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2.5 text-sm font-medium tap-target transition-all flex items-center justify-center gap-2 ${
              activeTab === 'calendar' ? 'gold-accent' : ''
            }`}
            style={{ color: activeTab === 'calendar' ? undefined : 'var(--text-muted)' }}
          >
            <Calendar size={16} />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-2.5 text-sm font-medium tap-target transition-all flex items-center justify-center gap-2 ${
              activeTab === 'sessions' ? 'gold-accent' : ''
            }`}
            style={{ color: activeTab === 'sessions' ? undefined : 'var(--text-muted)' }}
          >
            <Clock size={16} />
            Sessions
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'calendar' ? (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <CalendarComponent allTimeTrades={allTimeTrades} />
        </div>
      ) : activeTab === 'sessions' ? (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
          <SessionPerformance sessionStats={sessionStats} hourlyPerformance={hourlyPerformance} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-4">
          {/* Replay Today Button */}
        {todayTrades.length > 0 && (
          <button
            onClick={handleReplay}
            className="w-full py-4 rounded-2xl gold-accent font-semibold tap-target touch-manipulation active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Play size={18} />
            Replay Today ({todayTrades.length} trades)
          </button>
        )}

          {/* Key Metrics Section */}
          <section>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 px-1">Key Metrics</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Total Trades */}
              <div className="phone-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
                    <BarChart3 size={16} className="text-[var(--gold-primary)]" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Trades</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{allTime.totalTrades}</p>
              </div>

              {/* Win Rate */}
              <div className="phone-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
                    <TrendingUp size={16} className="text-[var(--gold-primary)]" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Win Rate</span>
                </div>
                <p className="text-2xl font-bold text-[var(--gold-primary)]">{allTime.winRate.toFixed(1)}%</p>
              </div>

              {/* Net R */}
              <div className="phone-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${allTime.netR >= 0 ? 'bg-[var(--profit-soft)]' : 'bg-[var(--loss-soft)]'}`}>
                    <TrendingUp size={16} className={allTime.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'} />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Net R</span>
                </div>
                <p className={`text-2xl font-bold ${allTime.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                  {allTime.netR >= 0 ? '+' : ''}{allTime.netR.toFixed(2)}R
                </p>
              </div>

              {/* Avg R */}
              <div className="phone-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <TrendingUp size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Avg R</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{allTime.avgR.toFixed(2)}R</p>
              </div>

              {/* Profit Factor */}
              {(() => {
                const winningTrades = allTimeTrades.filter(t => t.result === 'Win')
                const losingTrades = allTimeTrades.filter(t => t.result === 'Loss')
                const grossProfit = winningTrades.reduce((sum, t) => sum + t.rMultiple, 0)
                const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + Math.abs(t.rMultiple), 0))
                const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? Infinity : 0)
                const pfColor = profitFactor >= 1.5 ? 'var(--profit)' : profitFactor >= 1 ? 'var(--gold-primary)' : 'var(--loss)'
                const pfBg = profitFactor >= 1.5 ? 'var(--profit-soft)' : profitFactor >= 1 ? 'var(--gold-soft)' : 'var(--loss-soft)'
                return (
                  <div className="phone-card p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: pfBg }}>
                        <BarChart3 size={16} style={{ color: pfColor }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Profit Factor</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: pfColor }}>
                      {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {profitFactor >= 2 ? 'Excellent' : profitFactor >= 1.5 ? 'Good' : profitFactor >= 1 ? 'Break-even' : 'Poor'}
                    </p>
                  </div>
                )
              })()}

              {/* Expectancy */}
              {(() => {
                const winningTrades = allTimeTrades.filter(t => t.result === 'Win')
                const losingTrades = allTimeTrades.filter(t => t.result === 'Loss')
                const grossProfit = winningTrades.reduce((sum, t) => sum + t.rMultiple, 0)
                const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + Math.abs(t.rMultiple), 0))
                const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0
                const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0
                const winRate = allTime.winRate / 100
                const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss)
                return (
                  <div className="phone-card p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${expectancy > 0 ? 'bg-[var(--profit-soft)]' : 'bg-[var(--loss-soft)]'}`}>
                        <TrendingUp size={16} className={expectancy > 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Expectancy</span>
                    </div>
                    <p className={`text-2xl font-bold ${expectancy > 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                      {expectancy > 0 ? '+' : ''}{expectancy.toFixed(2)}R
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Expected per trade</p>
                  </div>
                )
              })()}
            </div>
          </section>

        {/* R-Multiple Histogram */}
        <RMHistogram trades={allTimeTrades} />

        {/* Win Rate Gauge & Discipline Ring */}
        <div className="grid grid-cols-2 gap-3">
          <WinRateGauge 
            winRate={allTime.winRate} 
            totalTrades={allTime.totalTrades} 
          />
          <DisciplineScoreRing 
            calmTrades={allTime.calmTrades}
            emotionalTrades={allTime.emotionalTrades}
            totalTrades={allTime.totalTrades}
          />
        </div>

        {/* Daily Performance Heat Strip */}
        <DailyHeatStrip trades={allTimeTrades} />

        {/* Setup Performance Bars */}
        <SetupPerformanceBars trades={allTimeTrades} />

        {/* Instrument Performance */}
        {(() => {
          const instruments = instrumentPerformance()
          if (instruments.length <= 1) return null
          return (
            <div className="phone-card p-4 rounded-xl">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Performance by Instrument</p>
              <div className="space-y-2">
                {instruments.map(({ name, trades, wins, netR, winRate }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{name}</span>
                      <span className="text-xs text-[var(--text-muted)]">({trades} trades)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${winRate >= 50 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                        {winRate.toFixed(0)}%
                      </span>
                      <span className={`text-sm font-bold ${netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                        {netR >= 0 ? '+' : ''}{netR.toFixed(1)}R
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Setup Trends Sparklines */}
        <SetupTrends trades={allTimeTrades} />

        {/* Emotion Analytics */}
        <section className="phone-card rounded-2xl p-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Emotions</p>

          {/* Emotion Stats */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[var(--profit-soft)] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[var(--profit)]">{allTime.pctCalm.toFixed(0)}%</p>
              <p className="text-xs mt-1 text-[var(--text-muted)]">Calm</p>
            </div>
            <div className="bg-[var(--loss-soft)] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[var(--loss)]">{allTime.pctEmotional.toFixed(0)}%</p>
              <p className="text-xs mt-1 text-[var(--text-muted)]">Emotional</p>
            </div>
          </div>

          {/* Revenge Trades */}
          <div className="bg-[var(--loss-soft)] rounded-xl p-3 flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--loss)]/20 flex items-center justify-center">
                <Zap size={18} className="text-[var(--loss)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Revenge Trades</p>
                <p className="text-xs text-[var(--text-muted)]">Avoid emotional trading</p>
              </div>
            </div>
            <span className="text-xl font-bold text-[var(--loss)]">{allTime.revengeTrades}</span>
          </div>

          {/* Emotion breakdown */}
          {emotions.length > 0 && (
            <div className="space-y-2">
              {emotions.map(emotion => (
                <div key={emotion.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-tertiary)]">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{emotion.name}</span>
                  <div className="text-right flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      (emotion.name === 'Calm' || emotion.name === 'Confident') ? 'text-[var(--profit)]' :
                      (emotion.name === 'Revenge Trading' || emotion.name === 'Overtrading Urge') ? 'text-[var(--loss)]' : 'text-[var(--text-secondary)]'
                    }`}>
                      {emotion.winRate.toFixed(0)}%
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)]">
                      {emotion.trades}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
      )}
    </div>
  )
}
