import type { Trade } from '../../types/trade'

interface DailyHeatStripProps {
  trades: Trade[]
  days?: number
}

export function DailyHeatStrip({ trades, days = 30 }: DailyHeatStripProps) {
  // Generate last N days
  const today = new Date()
  const dayData = Array.from({ length: days }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (days - 1 - i))
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000
    
    const dayTrades = trades.filter(t => t.timestamp >= startOfDay && t.timestamp < endOfDay)
    const netR = dayTrades.reduce((sum, t) => {
      if (t.result === 'Win') return sum + t.rMultiple
      if (t.result === 'Loss') return sum - Math.abs(t.rMultiple)
      return sum
    }, 0)
    
    return {
      date,
      day: date.getDate(),
      month: date.getMonth(),
      netR,
      tradeCount: dayTrades.length,
      hasTrades: dayTrades.length > 0
    }
  })

  const maxAbsR = Math.max(...dayData.map(d => Math.abs(d.netR)), 1)

  const getColor = (netR: number, hasTrades: boolean) => {
    if (!hasTrades) return 'var(--bg-tertiary)'
    if (netR > 0) {
      const intensity = Math.min(netR / maxAbsR, 1)
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`
    }
    if (netR < 0) {
      const intensity = Math.min(Math.abs(netR) / maxAbsR, 1)
      return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`
    }
    return 'var(--neutral)'
  }

  return (
    <div className="phone-card p-4">
      <p className="text-xs font-semibold mb-3 gold-text">Daily Performance (30 Days)</p>
      <div className="grid grid-cols-10 gap-1">
        {dayData.map((day, idx) => (
          <div
            key={idx}
            className="aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium"
            style={{
              background: getColor(day.netR, day.hasTrades),
              color: day.hasTrades ? '#fff' : 'var(--text-muted)'
            }}
            title={`${day.date.toLocaleDateString()}: ${day.netR >= 0 ? '+' : ''}${day.netR.toFixed(1)}R (${day.tradeCount} trades)`}
          >
            {day.day}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{dayData[0].date.toLocaleDateString(undefined, { month: 'short' })}</span>
        <div className="flex items-center gap-2">
          <span>Loss</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.5)' }} />
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(34, 197, 94, 0.5)' }} />
          </div>
          <span>Profit</span>
        </div>
        <span>{dayData[dayData.length - 1].date.toLocaleDateString(undefined, { month: 'short' })}</span>
      </div>
    </div>
  )
}
