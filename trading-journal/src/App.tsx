import { useState } from 'react'
import type { Trade } from './types/trade'
import type { ChallengeSetupInput } from './types/challenge'
import { HomeDashboard } from './components/HomeDashboard'
import { QuickLogger } from './components/QuickLogger'
import { Insights } from './components/Insights'
import { History } from './components/History'
import { ChallengeSetup } from './components/ChallengeSetup'
import { ChallengeDashboard } from './components/ChallengeDashboard'
import { DesktopLayout } from './components/DesktopLayout'
import { useTrades } from './hooks/useTrades'
import { useTemplates } from './hooks/useTemplates'
import { useWeeklyGoals } from './hooks/useWeeklyGoals'
import { useChallenge } from './hooks/useChallenge'

type Screen = 'home' | 'logger' | 'insights' | 'history' | 'challenge' | 'challenge-setup'

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
      default:
        return null
    }
  }

  return (
    <>
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
          <div className="pill-gold">
            {stats.today.netR >= 0 ? '+' : ''}{stats.today.netR.toFixed(1)}R
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
              { id: 'home', icon: 'H', label: 'Home' },
              { id: 'logger', icon: '+', label: 'Trade' },
              { id: 'history', icon: 'L', label: 'History' },
              { id: 'insights', icon: 'S', label: 'Stats' },
              { id: 'challenge', icon: 'C', label: 'Challenge' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as Screen)}
                className="flex flex-col items-center gap-1 py-2 px-3 tap-target touch-manipulation"
              >
                <span className={`text-lg font-bold ${currentScreen === item.id ? 'gold-text' : ''}`}
                  style={{ color: currentScreen === item.id ? 'var(--gold-primary)' : 'var(--text-muted)' }}>
                  {item.icon}
                </span>
                <span className="text-xs" style={{
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
