import { useState, useEffect } from 'react'
import type { Trade } from './types/trade'
import type { ChallengeSetupInput } from './types/challenge'
import { Home, Plus, History as HistoryIcon, BarChart3, Trophy, Settings } from 'lucide-react'
import { HomeDashboard } from './components/HomeDashboard'
import { QuickLogger } from './components/QuickLogger'
import { Insights } from './components/Insights'
import { History } from './components/History'
import { ChallengeSetup } from './components/ChallengeSetup'
import { ChallengeDashboard } from './components/ChallengeDashboard'
import { DesktopLayout } from './components/DesktopLayout'
import { Onboarding } from './components/Onboarding'
import { MobileSettings } from './components/MobileSettings'
import { InstallPrompt } from './components/InstallPrompt'
import { useTrades } from './hooks/useTrades'
import { useTemplates } from './hooks/useTemplates'
import { useWeeklyGoals } from './hooks/useWeeklyGoals'
import { useChallenge } from './hooks/useChallenge'
import { themeColors, type ThemeColor } from './hooks/useTheme'

type Screen = 'home' | 'logger' | 'insights' | 'history' | 'challenge' | 'challenge-setup' | 'settings'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [duplicateTrade, setDuplicateTrade] = useState<Trade | null>(null)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const {
    todayTrades,
    allTimeTrades,
    stats,
    disciplineAlerts,
    addTrade,
    deleteTrade,
    updateTrade,
    isLoaded
  } = useTrades()
  const { templates, addTemplate, deleteTemplate } = useTemplates()
  const { 
    currentGoal, 
    shouldShowGoalPrompt, 
    setWeeklyGoal, 
    updateCurrentR, 
    progress, 
    isGoalReached 
  } = useWeeklyGoals(allTimeTrades)
  const {
    challenge,
    currentDayData,
    progressStats,
    isLoaded: challengeLoaded,
    createChallenge,
    logDayTrades,
    recalculatePlan,
    deleteChallenge,
    getCurrentLotSize,
    isMajorDrawdown,
  } = useChallenge()

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [traderName, setTraderName] = useState('')

  // Initialize theme and check onboarding
  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('trading-journal-onboarding')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem('trading-journal-theme') as ThemeColor
    if (savedTheme && themeColors[savedTheme]) {
      const colors = themeColors[savedTheme]
      const root = document.documentElement
      root.style.setProperty('--gold-primary', colors.primary)
      root.style.setProperty('--gold-secondary', colors.secondary)
      root.style.setProperty('--gold-glow', colors.glow)
      root.style.setProperty('--gold-soft', colors.soft)
    }

    // Load trader name
    const savedName = localStorage.getItem('trading-journal-trader-name')
    if (savedName) {
      setTraderName(savedName)
    }
  }, [])

  const handleOnboardingComplete = (data: {
    traderName: string
    preferredSetup: string
    weeklyGoal: number
    theme: ThemeColor
    hasSeenOnboarding: boolean
  }) => {
    // Save all preferences
    localStorage.setItem('trading-journal-onboarding', 'true')
    localStorage.setItem('trading-journal-trader-name', data.traderName)
    localStorage.setItem('trading-journal-preferred-setup', data.preferredSetup)
    localStorage.setItem('trading-journal-theme', data.theme)
    
    // Apply theme
    const colors = themeColors[data.theme]
    const root = document.documentElement
    root.style.setProperty('--gold-primary', colors.primary)
    root.style.setProperty('--gold-secondary', colors.secondary)
    root.style.setProperty('--gold-glow', colors.glow)
    root.style.setProperty('--gold-soft', colors.soft)
    
    // Set weekly goal if provided
    if (data.weeklyGoal) {
      setWeeklyGoal(data.weeklyGoal)
    }
    
    setTraderName(data.traderName)
    setShowOnboarding(false)
  }

  const handleSkipOnboarding = () => {
    localStorage.setItem('trading-journal-onboarding', 'true')
    setShowOnboarding(false)
  }

  if (!isLoaded) {
    return (
      <div className="phone-container">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-lg font-semibold gold-text">AIOVAX</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  const handleStartNewTrade = () => {
    setDuplicateTrade(null)
    setCurrentScreen('logger')
  }

  const handleDuplicateTrade = (trade: Trade) => {
    setDuplicateTrade(trade)
    setEditingTrade(null)
    setCurrentScreen('logger')
  }

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade)
    setDuplicateTrade(null)
    setCurrentScreen('logger')
  }

  const handleTradeLogged = () => {
    setDuplicateTrade(null)
    setEditingTrade(null)
    updateCurrentR()
    setCurrentScreen('home')
  }

  const renderMobileScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeDashboard
            stats={stats}
            disciplineAlerts={disciplineAlerts}
            onStartNewTrade={handleStartNewTrade}
            todayTrades={todayTrades}
            weeklyGoal={currentGoal}
            shouldShowGoalPrompt={shouldShowGoalPrompt}
            onSetWeeklyGoal={setWeeklyGoal}
            weeklyProgress={progress}
            isWeeklyGoalReached={isGoalReached}
          />
        )
      case 'logger':
        return (
          <QuickLogger
            onTradeLogged={handleTradeLogged}
            addTrade={addTrade}
            initialTrade={duplicateTrade}
            templates={templates}
            onSaveTemplate={addTemplate}
            onDeleteTemplate={deleteTemplate}
            editTrade={updateTrade}
            editingTrade={editingTrade}
          />
        )
      case 'insights':
        return (
          <Insights
            stats={{
              allTime: stats.allTime,
              today: { streak: stats.today.streak, streakType: stats.today.streakType }
            }}
            todayTrades={todayTrades}
            allTimeTrades={allTimeTrades}
            deleteTrade={deleteTrade}
          />
        )
      case 'history':
        return (
          <History
            allTimeTrades={allTimeTrades}
            deleteTrade={deleteTrade}
            onDuplicateTrade={handleDuplicateTrade}
            onEditTrade={handleEditTrade}
          />
        )
      case 'challenge-setup':
        return (
          <ChallengeSetup
            onCreate={(input: ChallengeSetupInput) => {
              createChallenge(input)
              setCurrentScreen('challenge')
            }}
            onCancel={() => setCurrentScreen('home')}
          />
        )
      case 'challenge':
        return challenge ? (
          <ChallengeDashboard
            challenge={challenge}
            progressStats={progressStats}
            currentDayData={currentDayData}
            onLogDay={(dayNumber: number, profit: number) => {
              logDayTrades({ dayNumber, profit, trades: [], notes: '' })
            }}
            onRecalculate={recalculatePlan}
            onDelete={() => {
              deleteChallenge()
              setCurrentScreen('home')
            }}
          />
        ) : (
          <ChallengeSetup
            onCreate={(input: ChallengeSetupInput) => {
              createChallenge(input)
            }}
            onCancel={() => setCurrentScreen('home')}
          />
        )
      case 'settings':
        return (
          <MobileSettings 
            onResetAllData={() => {
              // Reset all localStorage data
              localStorage.removeItem('trading-journal-trades')
              localStorage.removeItem('trading-journal-weekly-goals')
              localStorage.removeItem('trading-journal-challenge')
              localStorage.removeItem('trading-journal-templates')
              localStorage.removeItem('trading-journal-trader-name')
              localStorage.removeItem('trading-journal-preferred-setup')
              localStorage.removeItem('trading-journal-theme')
              localStorage.removeItem('trading-journal-onboarding')
              // Reload to reset all state
              window.location.reload()
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding 
          onComplete={handleOnboardingComplete}
          onSkip={handleSkipOnboarding}
        />
      )}

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Desktop Layout - shown on screens >= 1024px */}
      <DesktopLayout
        stats={stats}
        disciplineAlerts={disciplineAlerts}
        todayTrades={todayTrades}
        allTimeTrades={allTimeTrades}
        weeklyGoal={currentGoal}
        shouldShowGoalPrompt={shouldShowGoalPrompt}
        weeklyProgress={progress}
        isWeeklyGoalReached={isGoalReached}
        templates={templates}
        challenge={challenge}
        currentDayData={currentDayData}
        progressStats={progressStats}
        onStartNewTrade={handleStartNewTrade}
        onSetWeeklyGoal={setWeeklyGoal}
        addTrade={addTrade}
        updateTrade={updateTrade}
        deleteTrade={deleteTrade}
        addTemplate={addTemplate}
        deleteTemplate={deleteTemplate}
        createChallenge={createChallenge}
        logDayTrades={logDayTrades}
        recalculatePlan={recalculatePlan}
        deleteChallenge={deleteChallenge}
        updateCurrentR={updateCurrentR}
      />

      {/* Mobile Layout - shown on screens < 1024px */}
      <div className="phone-container mobile-only">
        {/* Simple header */}
        <header className="flex-none px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">AIOVAX</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="pill-gold">
              {stats.today.netR >= 0 ? '+' : ''}{stats.today.netR.toFixed(1)}R
            </div>
            <button
              onClick={() => setCurrentScreen('settings')}
              className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-soft)] flex items-center justify-center tap-target"
              title="Settings"
            >
              <Settings size={18} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {renderMobileScreen()}
        </main>

        {/* Bottom tab bar */}
        <nav className="flex-none px-4 pb-6 pt-2">
          <div className="flex items-center justify-around">
            {[
              { id: 'home', Icon: Home, label: 'Home' },
              { id: 'history', Icon: HistoryIcon, label: 'History' },
              { id: 'logger', Icon: Plus, label: 'Trade', isCenter: true },
              { id: 'insights', Icon: BarChart3, label: 'Analytics' },
              { id: 'challenge', Icon: Trophy, label: 'Challenge' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as Screen)}
                className={`flex flex-col items-center tap-target touch-manipulation ${item.isCenter ? 'relative -top-3' : 'gap-1 py-2 px-1'}`}
              >
                {item.isCenter ? (
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${currentScreen === item.id ? 'gold-accent' : 'bg-[var(--bg-card)] border border-[var(--border-soft)]'}`}>
                    <item.Icon size={24} className={currentScreen === item.id ? 'text-black' : 'text-[var(--gold-primary)]'} />
                  </div>
                ) : (
                  <item.Icon size={20} className={currentScreen === item.id ? 'text-[var(--gold-primary)]' : 'text-[var(--text-muted)]'} />
                )}
                <span className={`text-[10px] ${item.isCenter ? 'mt-1' : ''}`} style={{
                  color: currentScreen === item.id ? 'var(--gold-primary)' : 'var(--text-muted)',
                  fontWeight: currentScreen === item.id ? 600 : 400
                }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  )
}

export default App
