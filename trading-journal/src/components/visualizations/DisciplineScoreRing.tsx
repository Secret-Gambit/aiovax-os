interface DisciplineScoreRingProps {
  calmTrades: number
  emotionalTrades: number
  totalTrades: number
}

export function DisciplineScoreRing({ 
  calmTrades, 
  emotionalTrades, 
  totalTrades 
}: DisciplineScoreRingProps) {
  const disciplineScore = totalTrades > 0 
    ? (calmTrades / totalTrades) * 100 
    : 0
  
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (disciplineScore / 100) * circumference
  
  // Color based on score
  let color = 'var(--loss)'
  if (disciplineScore >= 80) color = 'var(--profit)'
  else if (disciplineScore >= 60) color = 'var(--gold-primary)'
  else if (disciplineScore >= 40) color = '#fbbf24'

  return (
    <div className="phone-card p-4">
      <p className="text-xs font-semibold mb-3 gold-text">Discipline Score</p>
      
      <div className="flex items-center gap-4">
        {/* Ring chart */}
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="10"
            />
            {/* Score ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          
          {/* Center value */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className="text-lg font-bold"
              style={{ color }}
            >
              {disciplineScore.toFixed(0)}%
            </span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--profit)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Calm</span>
            </div>
            <span className="text-xs font-medium">{calmTrades}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ background: 'var(--loss)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Emotional</span>
            </div>
            <span className="text-xs font-medium">{emotionalTrades}</span>
          </div>
          <div className="pt-1 border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Total: {totalTrades} trades
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
