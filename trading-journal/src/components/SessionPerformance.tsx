import { Sun, Castle, Landmark, Moon, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react'
import type { SessionStats, HourlyPerformance } from '../utils/sessionAnalytics'
import { getSessionInfo } from '../utils/sessionAnalytics'

interface SessionPerformanceProps {
  sessionStats: SessionStats[]
  hourlyPerformance: HourlyPerformance[]
}

const sessionIcons = {
  'Asian': Sun,
  'London': Castle,
  'New York': Landmark,
  'Pre-Market': Moon
}

export function SessionPerformance({ sessionStats, hourlyPerformance }: SessionPerformanceProps) {
  // Filter to sessions with trades
  const activeSessions = sessionStats.filter(s => s.totalTrades > 0)
  
  // Find best performing session
  const bestSession = activeSessions.length > 0
    ? activeSessions.reduce((best, current) => current.netR > best.netR ? current : best)
    : null
  
  // Find best win rate session (min 5 trades)
  const bestWinRateSession = activeSessions.filter(s => s.totalTrades >= 5).length > 0
    ? activeSessions.filter(s => s.totalTrades >= 5).reduce((best, current) => current.winRate > best.winRate ? current : best)
    : null

  return (
    <div className="space-y-4">
      {/* Session Cards */}
      <div className="grid grid-cols-2 gap-3">
        {sessionStats.map(session => {
          const Icon = sessionIcons[session.session]
          const info = getSessionInfo(session.session)
          const hasData = session.totalTrades > 0
          
          return (
            <div 
              key={session.session}
              className={`phone-card rounded-xl p-3 ${!hasData ? 'opacity-60' : ''}`}
              style={{ borderLeft: hasData ? `3px solid ${info.color}` : undefined }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${info.color}20` }}
                >
                  <Icon size={16} style={{ color: info.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{session.session}</p>
                  <p className="text-xs text-[var(--text-muted)]">{info.timeRange}</p>
                </div>
              </div>
              
              {hasData ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Trades</span>
                    <span className="font-medium text-[var(--text-primary)]">{session.totalTrades}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Win Rate</span>
                    <span className={`font-medium ${session.winRate >= 50 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                      {session.winRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Net R</span>
                    <span className={`font-medium ${session.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                      {session.netR >= 0 ? '+' : ''}{session.netR.toFixed(1)}R
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Avg R</span>
                    <span className={`font-medium ${session.avgR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                      {session.avgR >= 0 ? '+' : ''}{session.avgR.toFixed(2)}R
                    </span>
                  </div>
                  {session.profitFactor > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Profit Factor</span>
                      <span className={`font-medium ${session.profitFactor >= 1.5 ? 'text-[var(--profit)]' : session.profitFactor >= 1 ? 'text-[var(--gold-primary)]' : 'text-[var(--loss)]'}`}>
                        {session.profitFactor === Infinity ? '∞' : session.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">No trades recorded</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Best Session Summary */}
      {bestSession && (
        <div className="phone-card rounded-xl p-4 bg-gradient-to-r from-[var(--gold-soft)] to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-[var(--gold-primary)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Best Performing Session</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--gold-primary)]">{bestSession.session}</span>
            <span className="text-lg text-[var(--profit)]">+{bestSession.netR.toFixed(1)}R</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {bestSession.wins}W / {bestSession.losses}L ({bestSession.winRate.toFixed(0)}% win rate)
          </p>
        </div>
      )}

      {/* Best Win Rate Session */}
      {bestWinRateSession && bestWinRateSession.session !== bestSession?.session && (
        <div className="phone-card rounded-xl p-4 bg-gradient-to-r from-[var(--profit-soft)] to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-[var(--profit)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Best Win Rate Session</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--profit)]">{bestWinRateSession.session}</span>
            <span className="text-lg text-[var(--profit)]">{bestWinRateSession.winRate.toFixed(0)}%</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Based on {bestWinRateSession.totalTrades}+ trades
          </p>
        </div>
      )}

      {/* Hourly Heat Strip */}
      <div className="phone-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Hourly Performance (UTC)</p>
          </div>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded">
            Your time: UTC{new Date().getTimezoneOffset() <= 0 ? '+' : '-'}{Math.abs(new Date().getTimezoneOffset() / 60)}
          </span>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {hourlyPerformance.slice(0, 24).map((hour) => (
            <div 
              key={hour.hour}
              className="flex flex-col items-center"
              title={`${hour.label}: ${hour.trades} trades, ${hour.winRate.toFixed(0)}% WR, ${hour.netR >= 0 ? '+' : ''}${hour.netR.toFixed(1)}R`}
            >
              <div 
                className="w-full h-8 rounded-sm"
                style={{
                  background: hour.trades === 0 
                    ? 'var(--bg-tertiary)' 
                    : hour.netR > 0 
                      ? `rgba(34, 197, 94, ${Math.min(Math.abs(hour.netR) / 5 + 0.2, 1)})`
                      : `rgba(239, 68, 68, ${Math.min(Math.abs(hour.netR) / 5 + 0.2, 1)})`
                }}
              />
              <span className="text-[10px] text-[var(--text-muted)] mt-1">
                {hour.hour.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-[var(--text-muted)]">
          <span>00:00 (Asian)</span>
          <span>08:00 (London)</span>
          <span>13:00 (NY)</span>
          <span>22:00 (Pre)</span>
        </div>
      </div>
    </div>
  )
}
