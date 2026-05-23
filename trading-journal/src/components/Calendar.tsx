import { useState, useMemo } from 'react'
import type { Trade } from '../types/trade'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface CalendarProps {
  allTimeTrades: Trade[]
  onSelectDate?: (timestamp: number) => void
}

export function Calendar({ allTimeTrades, onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Calculate daily P&L for each day
  const dailyStats = useMemo(() => {
    const stats = new Map<string, { netR: number; trades: number; timestamp: number }>()
    
    allTimeTrades.forEach(trade => {
      const date = new Date(trade.timestamp)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const existing = stats.get(key) || { netR: 0, trades: 0, timestamp: trade.timestamp }
      
      if (trade.result === 'Win') {
        existing.netR += trade.rMultiple
      } else if (trade.result === 'Loss') {
        existing.netR -= Math.abs(trade.rMultiple)
      }
      existing.trades += 1
      
      stats.set(key, existing)
    })
    
    return stats
  }, [allTimeTrades])

  // Get color for a day based on P&L
  const getDayColor = (netR: number, hasTrades: boolean) => {
    if (!hasTrades) return 'var(--bg-tertiary)'
    if (netR > 0) {
      // Green scale based on R amount
      if (netR >= 5) return 'var(--profit)'
      if (netR >= 2) return 'rgba(76, 175, 80, 0.7)'
      return 'rgba(76, 175, 80, 0.4)'
    }
    if (netR < 0) {
      // Red scale based on R amount
      if (netR <= -5) return 'var(--loss)'
      if (netR <= -2) return 'rgba(244, 67, 54, 0.7)'
      return 'rgba(244, 67, 54, 0.4)'
    }
    return 'var(--neutral)' // Breakeven
  }

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // First day of month
    const firstDay = new Date(year, month, 1)
    // Last day of month
    const lastDay = new Date(year, month + 1, 0)
    
    // Start from Sunday of the first week
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    // Generate 6 weeks (42 days)
    const days: Array<{
      date: Date
      key: string
      netR: number
      trades: number
      isCurrentMonth: boolean
    }> = []
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const stats = dailyStats.get(key) || { netR: 0, trades: 0, timestamp: 0 }
      
      days.push({
        date,
        key,
        netR: stats.netR,
        trades: stats.trades,
        isCurrentMonth: date.getMonth() === month,
      })
    }
    
    return days
  }, [currentMonth, dailyStats])

  // Navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="flex flex-col h-full px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="gold-text" />
          <h2 className="text-lg font-bold">Trading Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg tap-target touch-manipulation"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            title="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold min-w-[100px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg tap-target touch-manipulation"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            title="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--profit)' }} />
          <span>Profit</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--loss)' }} />
          <span>Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--neutral)' }} />
          <span>BE</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--bg-tertiary)' }} />
          <span>No trades</span>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs py-1 font-medium" style={{ color: 'var(--text-muted)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDays.map((day, index) => {
          const hasTrades = day.trades > 0
          const backgroundColor = getDayColor(day.netR, hasTrades)
          const isToday = new Date().toDateString() === day.date.toDateString()
          
          return (
            <button
              key={index}
              onClick={() => hasTrades && onSelectDate?.(day.date.getTime())}
              disabled={!hasTrades}
              className={`
                rounded-lg p-1 flex flex-col items-center justify-center min-h-[60px]
                transition-all tap-target touch-manipulation
                ${hasTrades ? 'hover:scale-105 active:scale-95' : 'cursor-default'}
                ${isToday ? 'ring-2 ring-[var(--gold-primary)]' : ''}
                ${!day.isCurrentMonth ? 'opacity-40' : ''}
              `}
              style={{ background: backgroundColor }}
            >
              <span className={`text-sm font-medium ${hasTrades ? 'text-white' : ''}`}>
                {day.date.getDate()}
              </span>
              {hasTrades && (
                <span className="text-[10px] mt-0.5 font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {day.netR > 0 ? '+' : ''}{day.netR.toFixed(1)}R
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Monthly stats */}
      {(() => {
        const monthTrades = allTimeTrades.filter(t => {
          const date = new Date(t.timestamp)
          return date.getMonth() === currentMonth.getMonth() && 
                 date.getFullYear() === currentMonth.getFullYear()
        })
        
        if (monthTrades.length === 0) return null
        
        const monthNetR = monthTrades.reduce((sum, t) => {
          if (t.result === 'Win') return sum + t.rMultiple
          if (t.result === 'Loss') return sum - Math.abs(t.rMultiple)
          return sum
        }, 0)
        
        const tradingDays = new Set(monthTrades.map(t => {
          const date = new Date(t.timestamp)
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        })).size
        
        return (
          <div className="flex-none mt-4 phone-card rounded-xl p-3">
            <p className="text-xs font-semibold mb-2 gold-text">{monthNames[currentMonth.getMonth()]} SUMMARY</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{monthTrades.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Trades</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${monthNetR >= 0 ? 'status-profit' : 'status-loss'}`}>
                  {monthNetR >= 0 ? '+' : ''}{monthNetR.toFixed(1)}R
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Net R</p>
              </div>
              <div>
                <p className="text-lg font-bold">{tradingDays}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Days</p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
