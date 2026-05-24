import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Target, 
  Trophy, 
  BarChart3, 
  ChevronRight, 
  ChevronLeft,
  Check,
  User,
  Settings,
  Sparkles
} from 'lucide-react'
import type { ThemeColor } from '../hooks/useTheme'
import { themeColors } from '../hooks/useTheme'

interface OnboardingData {
  traderName: string
  preferredSetup: string
  weeklyGoal: number
  theme: ThemeColor
  hasSeenOnboarding: boolean
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void
  onSkip: () => void
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'preferences', title: 'Preferences', icon: Settings },
  { id: 'features', title: 'Key Features', icon: Trophy },
]

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    traderName: '',
    preferredSetup: '',
    weeklyGoal: 10,
    theme: 'gold',
    hasSeenOnboarding: true,
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Small delay for animation
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete(data)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-soft)] shadow-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--bg-tertiary)]">
          <div 
            className="h-full bg-[var(--gold-primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = STEPS[currentStep].icon
              return (
                <div className="w-10 h-10 rounded-xl bg-[var(--gold-soft)] flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-[var(--gold-primary)]" />
                </div>
              )
            })()}
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                {STEPS[currentStep].title}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Step {currentStep + 1} of {STEPS.length}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {currentStep === 0 && (
            <WelcomeStep />
          )}
          {currentStep === 1 && (
            <ProfileStep 
              traderName={data.traderName}
              preferredSetup={data.preferredSetup}
              onUpdate={updateData}
            />
          )}
          {currentStep === 2 && (
            <PreferencesStep
              theme={data.theme}
              weeklyGoal={data.weeklyGoal}
              onUpdate={updateData}
            />
          )}
          {currentStep === 3 && (
            <FeaturesStep />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-soft)]">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentStep === 0 
                ? 'opacity-0 cursor-default' 
                : 'hover:bg-[var(--bg-card)] text-[var(--text-secondary)]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep 
                    ? 'bg-[var(--gold-primary)] w-4' 
                    : i < currentStep 
                      ? 'bg-[var(--gold-primary)]/50' 
                      : 'bg-[var(--bg-card)]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-[var(--gold-primary)] text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                Get Started
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--gold-primary)] to-[var(--gold-secondary)] flex items-center justify-center mx-auto">
        <span className="text-4xl font-bold text-black">A</span>
      </div>
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Welcome to AIOVAX
        </h3>
        <p className="text-[var(--text-secondary)]">
          Your professional trading journal for XAUUSD. Track trades, analyze performance, 
          and improve your discipline with powerful analytics.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
          <TrendingUp className="w-5 h-5 text-[var(--gold-primary)] mb-2" />
          <p className="font-medium text-[var(--text-primary)]">Track Trades</p>
          <p className="text-xs text-[var(--text-muted)]">Log with voice & images</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
          <BarChart3 className="w-5 h-5 text-[var(--gold-primary)] mb-2" />
          <p className="font-medium text-[var(--text-primary)]">Analytics</p>
          <p className="text-xs text-[var(--text-muted)]">Profit Factor & more</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
          <Target className="w-5 h-5 text-[var(--gold-primary)] mb-2" />
          <p className="font-medium text-[var(--text-primary)]">Weekly Goals</p>
          <p className="text-xs text-[var(--text-muted)]">R-multiple tracking</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]">
          <Trophy className="w-5 h-5 text-[var(--gold-primary)] mb-2" />
          <p className="font-medium text-[var(--text-primary)]">Challenges</p>
          <p className="text-xs text-[var(--text-muted)]">Prop firm simulation</p>
        </div>
      </div>
    </div>
  )
}

function ProfileStep({ 
  traderName, 
  preferredSetup, 
  onUpdate 
}: { 
  traderName: string
  preferredSetup: string
  onUpdate: (updates: Partial<OnboardingData>) => void 
}) {
  const setups = ['ICT', 'SMC', 'Price Action', 'Supply & Demand', 'Support/Resistance', 'Multiple']

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-secondary)]">
        Let's personalize your experience. What should we call you?
      </p>
      
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Trader Name
        </label>
        <input
          type="text"
          value={traderName}
          onChange={(e) => onUpdate({ traderName: e.target.value })}
          placeholder="Enter your name or alias"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Preferred Trading Strategy
        </label>
        <div className="flex flex-wrap gap-2">
          {setups.map((setup) => (
            <button
              key={setup}
              onClick={() => onUpdate({ preferredSetup: setup })}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                preferredSetup === setup
                  ? 'bg-[var(--gold-primary)] text-black'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/50'
              }`}
            >
              {setup}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreferencesStep({ 
  theme, 
  weeklyGoal, 
  onUpdate 
}: { 
  theme: ThemeColor
  weeklyGoal: number
  onUpdate: (updates: Partial<OnboardingData>) => void 
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          Choose Your Theme
        </label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(themeColors) as ThemeColor[]).map((themeKey) => (
            <button
              key={themeKey}
              onClick={() => onUpdate({ theme: themeKey })}
              className={`p-2 rounded-xl border-2 transition-all ${
                theme === themeKey 
                  ? 'border-[var(--gold-primary)] bg-[var(--gold-soft)]' 
                  : 'border-transparent bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <div 
                className="w-6 h-6 rounded-lg mx-auto mb-1"
                style={{ 
                  background: `linear-gradient(135deg, ${themeColors[themeKey].primary}, ${themeColors[themeKey].secondary})` 
                }}
              />
              <span className="text-[10px] capitalize text-[var(--text-secondary)]">{themeKey}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          Weekly R Goal
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={weeklyGoal}
            onChange={(e) => onUpdate({ weeklyGoal: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-2xl font-bold text-[var(--gold-primary)] w-16 text-right">
            {weeklyGoal}R
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          This is your target R-multiple for the week. Aim high but stay realistic!
        </p>
      </div>
    </div>
  )
}

function FeaturesStep() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Quick Trade Logging',
      desc: 'Voice notes, chart screenshots, emotion tracking',
    },
    {
      icon: BarChart3,
      title: 'TradeZella-Style Dashboard',
      desc: 'Profit Factor, Expectancy, Setup Performance',
    },
    {
      icon: Target,
      title: 'Weekly Goals',
      desc: 'Track your R-multiple progress in real-time',
    },
    {
      icon: Trophy,
      title: 'Challenge Engine',
      desc: 'Simulate prop firm challenges with lot size calculator',
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-secondary)]">
        You're all set! Here's what you can do with AIOVAX:
      </p>
      
      <div className="space-y-3">
        {features.map((feature, i) => (
          <div 
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)]"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center flex-shrink-0">
              <feature.icon className="w-5 h-5 text-[var(--gold-primary)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">{feature.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-[var(--gold-soft)] border border-[var(--gold-primary)]/30">
        <p className="text-sm text-center text-[var(--text-primary)]">
          <span className="font-semibold">Pro Tip:</span> Start by logging your first trade to see the analytics in action!
        </p>
      </div>
    </div>
  )
}
