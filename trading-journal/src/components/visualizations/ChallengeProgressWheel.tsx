import type { Challenge } from '../../types/challenge'

interface ChallengeProgressWheelProps {
  challenge: Challenge
}

export function ChallengeProgressWheel({ challenge }: ChallengeProgressWheelProps) {
  const totalDays = challenge.maxDays + challenge.totalExtensions
  const completedDays = challenge.currentDay - 1
  const progressPercent = (completedDays / totalDays) * 100
  
  // Balance progress
  const balanceProgress = ((challenge.startBalance - challenge.targetBalance) !== 0)
    ? ((challenge.days.reduce((sum, d) => sum + (d.actualProfit || 0), 0)) / (challenge.targetBalance - challenge.startBalance)) * 100
    : 0
  
  const circumference = 2 * Math.PI * 45
  const daysOffset = circumference - (progressPercent / 100) * circumference
  
  // Status colors
  let statusColor = 'var(--gold-primary)'
  if (challenge.status === 'completed') statusColor = 'var(--profit)'
  if (challenge.status === 'failed') statusColor = 'var(--loss)'

  return (
    <div className="phone-card p-4">
      <p className="text-xs font-semibold mb-3 gold-text">Challenge Progress</p>
      
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="8"
            />
            {/* Days progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={statusColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={daysOffset}
              className="transition-all duration-500"
            />
            {/* Inner ring for balance progress */}
            <circle
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke={balanceProgress >= 100 ? 'var(--profit)' : 'var(--profit-soft)'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 32}
              strokeDashoffset={(2 * Math.PI * 32) - (Math.min(balanceProgress, 100) / 100) * (2 * Math.PI * 32)}
              className="transition-all duration-500"
            />
          </svg>
          
          {/* Center info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color: statusColor }}>
              {Math.round(progressPercent)}%
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Day {challenge.currentDay}/{totalDays}
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Target</p>
            <p className="text-sm font-medium">${challenge.targetBalance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Current</p>
            <p className="text-sm font-medium">
              ${(challenge.startBalance + challenge.days.reduce((sum, d) => sum + (d.actualProfit || 0), 0)).toLocaleString()}
            </p>
          </div>
          {challenge.totalExtensions > 0 && (
            <div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Extensions</p>
              <p className="text-sm font-medium" style={{ color: 'var(--gold-primary)' }}>
                {challenge.totalExtensions} applied
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
          <span>Days</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--profit)' }} />
          <span>Profit</span>
        </div>
      </div>
    </div>
  )
}
