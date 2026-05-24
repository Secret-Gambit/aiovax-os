import { useState } from 'react'

interface EmotionIntensitySliderProps {
  value: number
  onChange: (value: number) => void
  label?: string
}

const EMOTION_LABELS: Record<number, string> = {
  0: 'Calm',
  25: 'Confident',
  50: 'Impatient',
  75: 'Fearful',
  100: 'Revenge'
}

const getEmotionFromValue = (value: number): string => {
  if (value <= 12) return 'Calm'
  if (value <= 37) return 'Confident'
  if (value <= 62) return 'Impatient'
  if (value <= 87) return 'Fearful'
  return 'Revenge Trading'
}

const getColorFromValue = (value: number): string => {
  if (value <= 37) return 'var(--profit)'
  if (value <= 62) return '#fbbf24'
  return 'var(--loss)'
}

export function EmotionIntensitySlider({ 
  value, 
  onChange, 
  label = 'Emotion Intensity' 
}: EmotionIntensitySliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const emotion = getEmotionFromValue(value)
  const color = getColorFromValue(value)

  return (
    <div className="phone-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold gold-text">{label}</p>
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ 
            background: `${color}20`,
            color: color 
          }}
        >
          {emotion}
        </span>
      </div>
      
      <div className="relative pt-1">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--profit) 0%, #fbbf24 50%, var(--loss) 100%)`
          }}
        />
        <div className="flex justify-between mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>Calm</span>
          <span>Neutral</span>
          <span>Revenge</span>
        </div>
      </div>

      {/* Intensity visualization */}
      <div className="flex items-center gap-1 mt-3">
        {Array.from({ length: 5 }, (_, i) => {
          const threshold = (i + 1) * 20
          const isActive = value >= threshold - 10
          return (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-200"
              style={{
                background: isActive ? color : 'var(--bg-tertiary)',
                opacity: isActive ? 1 : 0.3
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
