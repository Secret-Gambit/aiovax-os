import { useState, useEffect } from 'react'
import { themeColors, type ThemeColor } from '../hooks/useTheme'

// Read theme synchronously to prevent flash of wrong color
const getSavedTheme = (): ThemeColor => {
  if (typeof window === 'undefined') return 'gold'
  const saved = localStorage.getItem('trading-journal-theme') as ThemeColor
  return saved && themeColors[saved] ? saved : 'gold'
}

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [currentTheme] = useState<ThemeColor>(getSavedTheme())

  const colors = themeColors[currentTheme]

  const messages = [
    "Initializing trading engine...",
    "Loading market data feeds...",
    "Calibrating analytics modules...",
    "Syncing chart libraries...",
    "Optimizing R-multiple calculations...",
    "Preparing discipline tracker...",
    "Loading trade templates...",
    "Connecting to gold markets...",
    "Finalizing setup..."
  ]

  useEffect(() => {
    // Progress animation over 5 seconds
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)

    // Message cycling
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => {
        if (prev < messages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 550) // Change message every ~550ms

    // Complete after 5 seconds
    const completeTimeout = setTimeout(() => {
      onComplete()
    }, 5000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
      clearTimeout(completeTimeout)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${colors.primary}08 1px, transparent 1px),
            linear-gradient(90deg, ${colors.primary}08 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'perspective(500px) rotateX(60deg) translateY(0)',
          animation: 'gridMove 20s linear infinite'
        }}
      />

      {/* Tech Decorations */}
      <div className="absolute top-8 left-8 text-[10px] font-mono tracking-wider" style={{ color: `${colors.primary}26` }}>
        ◄ SYSTEM_READY ►
      </div>
      <div className="absolute top-8 right-8 text-[10px] font-mono tracking-wider" style={{ color: `${colors.primary}26` }}>
        v1.0.0
      </div>
      <div className="absolute bottom-8 left-8 text-[10px] font-mono tracking-wider" style={{ color: `${colors.primary}26` }}>
        XAU/USD
      </div>
      <div className="absolute bottom-8 right-8 text-[10px] font-mono tracking-wider" style={{ color: `${colors.primary}26` }}>
        PRO_TRADER
      </div>

      {/* Logo with Orbit */}
      <div className="relative w-[100px] h-[100px] mb-8">
        {/* Orbit Ring */}
        <div 
          className="absolute top-1/2 left-1/2 w-[140px] h-[140px] -mt-[70px] -ml-[70px] rounded-full border"
          style={{ 
            borderColor: `${colors.primary}33`,
            animation: 'orbitRotate 4s linear infinite'
          }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: colors.primary, boxShadow: `0 0 10px ${colors.primary}` }} />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: colors.primary, boxShadow: `0 0 10px ${colors.primary}` }} />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: colors.primary, boxShadow: `0 0 10px ${colors.primary}` }} />
        </div>

        {/* Logo */}
        <div 
          className="w-full h-full rounded-3xl flex items-center justify-center text-[56px] font-bold text-black"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 0 60px ${colors.primary}4D, 0 0 100px ${colors.primary}1A`,
            animation: 'logoPulse 2s ease-in-out infinite, logoRotate 3s ease-in-out infinite'
          }}
        >
          A
        </div>
      </div>

      {/* Brand */}
      <div 
        className="text-[28px] font-extrabold tracking-[4px] uppercase mb-2"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.primary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
          textShadow: `0 0 30px ${colors.primary}40`
        }}
      >
        AIOVAX
      </div>
      <div className="text-xs text-[#666] tracking-[6px] uppercase mb-10">
        Trading Journal
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 font-mono text-sm text-[#888] min-h-[20px]">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: colors.primary,
            animation: 'statusBlink 1s ease-in-out infinite'
          }}
        />
        <span className="transition-opacity duration-200">
          {messages[messageIndex]}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-[280px] h-1 rounded-sm mt-5 overflow-hidden relative" style={{ backgroundColor: `${colors.primary}1A` }}>
        <div 
          className="h-full rounded-sm transition-all duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 0 10px ${colors.primary}80`
          }}
        >
          {/* Shimmer */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div className="font-mono text-xs text-[#666] mt-3">
        {progress}%
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }
        @keyframes orbitRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes logoRotate {
          0%, 100% { transform: rotateY(0deg); }
          50% { transform: rotateY(10deg); }
        }
        @keyframes statusBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
