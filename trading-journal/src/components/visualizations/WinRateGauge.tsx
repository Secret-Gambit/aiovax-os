interface WinRateGaugeProps {
  winRate: number
  targetWinRate?: number
  totalTrades: number
}

export function WinRateGauge({ 
  winRate, 
  targetWinRate = 50, 
  totalTrades 
}: WinRateGaugeProps) {
  // Calculate arc position (0-100% maps to -90deg to 90deg)
  const angle = (winRate / 100) * 180 - 90
  const targetAngle = (targetWinRate / 100) * 180 - 90
  
  // Color based on performance vs target
  const isOnTarget = winRate >= targetWinRate
  const color = isOnTarget ? 'var(--profit)' : 'var(--gold-primary)'

  return (
    <div className="phone-card p-4">
      <p className="text-xs font-semibold mb-3 gold-text">Win Rate</p>
      
      <div className="flex flex-col items-center">
        {/* Semi-circle gauge */}
        <div className="relative w-32 h-16">
          {/* Background arc */}
          <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full">
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Target marker */}
            <line
              x1="50"
              y1="50"
              x2={50 + 35 * Math.cos((targetAngle * Math.PI) / 180)}
              y2={50 + 35 * Math.sin((targetAngle * Math.PI) / 180)}
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
            {/* Value arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(winRate / 100) * 126} 126`}
              className="transition-all duration-500"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px' }}
            />
          </svg>
          
          {/* Center value */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-center">
            <span 
              className="text-2xl font-bold"
              style={{ color }}
            >
              {winRate.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {totalTrades} trades
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Target: {targetWinRate}%
          </p>
        </div>
      </div>
    </div>
  )
}
