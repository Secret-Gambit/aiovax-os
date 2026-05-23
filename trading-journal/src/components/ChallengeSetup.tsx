import { useState } from 'react'
import type { ChallengeSetupInput } from '../types/challenge'
import { Target, Calendar, TrendingUp, DollarSign, ChevronRight, Loader2, Check, Crosshair } from 'lucide-react'

interface ChallengeSetupProps {
  onCreate: (input: ChallengeSetupInput) => void
  onCancel: () => void
}

export function ChallengeSetup({ onCreate, onCancel }: ChallengeSetupProps) {
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [input, setInput] = useState<ChallengeSetupInput>({
    name: '',
    startBalance: 250,
    targetBalance: 1024000,
    riskRewardRatio: 4,
    maxDays: 60,
    avgStopLossPips: 50,
  })

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      generatePlan()
    }
  }

  const generatePlan = () => {
    setIsGenerating(true)
    // Simulate calculation delay for dramatic effect
    setTimeout(() => {
      onCreate(input)
    }, 2500)
  }

  const canProceed = () => {
    switch (step) {
      case 1: return input.name.trim().length > 0
      case 2: return input.startBalance > 0 && input.targetBalance > input.startBalance
      case 3: return input.riskRewardRatio >= 1 && input.riskRewardRatio <= 20
      case 4: return input.avgStopLossPips >= 10 && input.avgStopLossPips <= 100
      case 5: return input.maxDays >= 7 && input.maxDays <= 365
      default: return false
    }
  }

  // Calculate preview stats
  const dailyRate = Math.pow(input.targetBalance / input.startBalance, 1 / input.maxDays) - 1
  const dailyProfit = input.startBalance * dailyRate
  const totalReturn = ((input.targetBalance - input.startBalance) / input.startBalance) * 100

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full gold-accent flex items-center justify-center mx-auto animate-pulse">
              <Loader2 size={40} className="animate-spin" />
            </div>
            <div className="absolute inset-0 w-24 h-24 rounded-full gold-accent opacity-30 animate-ping" />
          </div>
          
          <h2 className="text-xl font-bold mb-4">Creating Your Challenge Plan</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Calculating optimal daily targets...
          </p>
          
          <div className="space-y-3 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Check size={16} className="gold-text" />
              <span>Analyzing compounding requirements</span>
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Check size={16} className="gold-text" />
              <span>Calculating daily lot sizes</span>
            </div>
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Check size={16} className="gold-text" />
              <span>Building adaptive framework</span>
            </div>
            <div className="flex items-center gap-3 text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
              <Loader2 size={16} />
              <span>Finalizing your challenge...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New Challenge</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg tap-target"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>
        
        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s === step ? 'gold-accent' : s < step ? 'bg-green-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gold-accent flex items-center justify-center mx-auto mb-4">
                <Target size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Name Your Challenge</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Give it a name that motivates you
              </p>
            </div>

            <div className="phone-card rounded-xl p-4">
              <input
                type="text"
                value={input.name}
                onChange={(e) => setInput({ ...input, name: e.target.value })}
                placeholder="e.g., 60-Day Prop Challenge"
                className="w-full bg-transparent text-lg font-semibold outline-none text-center"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['Prop Firm Challenge', 'Personal Goal', 'Funded Account'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setInput({ ...input, name: preset })}
                  className="phone-card rounded-lg p-3 text-sm tap-target"
                  style={{ color: input.name === preset ? 'var(--gold-primary)' : 'var(--text-secondary)' }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gold-accent flex items-center justify-center mx-auto mb-4">
                <DollarSign size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Set Your Targets</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Start small, dream big
              </p>
            </div>

            <div className="space-y-4">
              <div className="phone-card rounded-xl p-4">
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  STARTING BALANCE ($)
                </label>
                <input
                  type="number"
                  value={input.startBalance}
                  onChange={(e) => setInput({ ...input, startBalance: Number(e.target.value) })}
                  className="w-full bg-transparent text-2xl font-bold outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <div className="flex gap-2 mt-3">
                  {[100, 250, 500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setInput({ ...input, startBalance: amt })}
                      className={`px-3 py-1.5 rounded-lg text-xs tap-target ${
                        input.startBalance === amt ? 'gold-accent' : 'bg-white/5'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="phone-card rounded-xl p-4">
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  TARGET BALANCE ($)
                </label>
                <input
                  type="number"
                  value={input.targetBalance}
                  onChange={(e) => setInput({ ...input, targetBalance: Number(e.target.value) })}
                  className="w-full bg-transparent text-2xl font-bold outline-none"
                  style={{ color: 'var(--gold-primary)' }}
                />
                <div className="flex gap-2 mt-3">
                  {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setInput({ ...input, targetBalance: amt })}
                      className={`px-3 py-1.5 rounded-lg text-xs tap-target ${
                        input.targetBalance === amt ? 'gold-accent' : 'bg-white/5'
                      }`}
                    >
                      ${amt >= 1000000 ? '1M' : amt >= 1000 ? `${amt/1000}K` : amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Return</span>
                <span className="text-lg font-bold gold-text">+{totalReturn.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gold-accent flex items-center justify-center mx-auto mb-4">
                <Crosshair size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Average Stop Loss</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your typical stop loss in pips for XAUUSD
              </p>
            </div>

            <div className="phone-card rounded-xl p-6 text-center">
              <div className="text-5xl font-bold mb-2">{input.avgStopLossPips}</div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Pips
              </p>
              
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={input.avgStopLossPips}
                onChange={(e) => setInput({ ...input, avgStopLossPips: Number(e.target.value) })}
                className="w-full mb-6"
              />
              
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Tight (10 pips)</span>
                <span>Wide (100 pips)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[20, 30, 40, 50, 60, 80].map((pips) => (
                <button
                  key={pips}
                  onClick={() => setInput({ ...input, avgStopLossPips: pips })}
                  className={`py-3 rounded-lg text-sm font-semibold tap-target ${
                    input.avgStopLossPips === pips ? 'gold-accent' : 'phone-card'
                  }`}
                >
                  {pips} pips
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gold-accent flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Risk to Reward Ratio</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Higher R:R = fewer trades needed but harder to hit
              </p>
            </div>

            <div className="phone-card rounded-xl p-6 text-center">
              <div className="text-5xl font-bold mb-2 gold-text">1:{input.riskRewardRatio}</div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Risk $1 to make ${input.riskRewardRatio}
              </p>
              
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={input.riskRewardRatio}
                onChange={(e) => setInput({ ...input, riskRewardRatio: Number(e.target.value) })}
                className="w-full mb-6"
              />
              
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Conservative (1:2)</span>
                <span>Aggressive (1:10)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4, 5, 6, 8].map((rr) => (
                <button
                  key={rr}
                  onClick={() => setInput({ ...input, riskRewardRatio: rr })}
                  className={`py-3 rounded-lg text-sm font-semibold tap-target ${
                    input.riskRewardRatio === rr ? 'gold-accent' : 'phone-card'
                  }`}
                >
                  1:{rr}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gold-accent flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Challenge Duration</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                How many trading days?
              </p>
            </div>

            <div className="phone-card rounded-xl p-6 text-center">
              <div className="text-5xl font-bold mb-2">{input.maxDays}</div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Trading Days
              </p>
              
              <input
                type="range"
                min="7"
                max="180"
                step="1"
                value={input.maxDays}
                onChange={(e) => setInput({ ...input, maxDays: Number(e.target.value) })}
                className="w-full mb-6"
              />
              
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>1 Week</span>
                <span>6 Months</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90, 120, 150, 180].map((days) => (
                <button
                  key={days}
                  onClick={() => setInput({ ...input, maxDays: days })}
                  className={`py-3 rounded-lg text-sm font-semibold tap-target ${
                    input.maxDays === days ? 'gold-accent' : 'phone-card'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            {/* Preview Card */}
            <div className="phone-card rounded-xl p-4 mt-6">
              <p className="text-xs font-semibold mb-3 gold-text">PLAN PREVIEW</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Daily Growth Needed</span>
                  <span className="font-semibold">{(dailyRate * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Day 1 Target</span>
                  <span className="font-semibold">+${dailyProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Final Day Balance</span>
                  <span className="font-semibold gold-text">${input.targetBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex-none px-5 py-4 flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-xl font-semibold tap-target phone-card"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`flex-1 py-3 rounded-xl font-semibold tap-target flex items-center justify-center gap-2 ${
            canProceed() ? 'gold-accent' : 'phone-card select-inactive cursor-not-allowed'
          }`}
        >
          {step === 5 ? 'Create Plan' : 'Continue'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
