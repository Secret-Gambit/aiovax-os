import { Flame, Snowflake } from 'lucide-react'

interface StreakVisualizerProps {
  streak: number
  streakType: 'win' | 'loss' | null
}

export function StreakVisualizer({ streak, streakType }: StreakVisualizerProps) {
  const absStreak = Math.abs(streak)
  const isWin = streakType === 'win'
  const isLoss = streakType === 'loss'
  
  // Determine intensity level (1-5)
  const intensity = Math.min(absStreak, 5)
  
  const getIcon = (level: number) => {
    if (isWin) {
      return (
        <Flame 
          size={16 + level * 4} 
          style={{ 
            color: level >= 4 ? '#ef4444' : level >= 3 ? '#fbbf24' : 'var(--profit)',
            opacity: level <= intensity ? 1 : 0.2
          }} 
        />
      )
    }
    if (isLoss) {
      return (
        <Snowflake 
          size={16 + level * 4} 
          style={{ 
            color: 'var(--loss)',
            opacity: level <= intensity ? 1 : 0.2
          }} 
        />
      )
    }
    return null
  }

  if (!streakType) {
    return (
      <div className="phone-card p-4">
        <p className="text-xs font-semibold mb-2 gold-text">Streak</p>
        <div className="flex items-center justify-center py-4">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No active streak</span>
        </div>
      </div>
    )
  }

  return (
    <div className="phone-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold gold-text">
          {isWin ? 'Winning Streak' : 'Losing Streak'}
        </p>
        <span 
          className="text-lg font-bold"
          style={{ color: isWin ? 'var(--profit)' : 'var(--loss)' }}
        >
          {absStreak} {isWin ? 'W' : 'L'}
        </span>
      </div>
      
      {/* Intensity visualization */}
      <div className="flex items-center justify-center gap-1 py-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="transition-all duration-300"
            style={{
              transform: level <= intensity ? 'scale(1)' : 'scale(0.8)',
            }}
          >
            {getIcon(level)}
          </div>
        ))}
      </div>
      
      {/* Message based on streak */}
      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
        {isWin && absStreak >= 3 && '🔥 You are on fire! Consider increasing size'}
        {isWin && absStreak < 3 && 'Good momentum, stick to your plan'}
        {isLoss && absStreak >= 2 && '⚠️ Take a break. Reset before continuing'}
        {isLoss && absStreak < 2 && 'Stay disciplined. One loss is normal'}
      </p>
    </div>
  )
}
