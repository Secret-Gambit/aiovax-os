import { useState, useEffect } from 'react'
import type { Trade, TradeTemplate } from '../types/trade'
import type { Challenge, ChallengeDay, ChallengeSetupInput, AdaptiveAdjustment } from '../types/challenge'
import type { DisciplineAlert } from '../hooks/useTrades'
import type { WeeklyGoal } from '../hooks/useWeeklyGoals'
import type { ThemeColor } from '../hooks/useTheme'
import { themeColors } from '../hooks/useTheme'
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart3, 
  Trophy, 
  Settings,
  TrendingUp,
  TrendingDown,
  Flame,
  Target
} from 'lucide-react'
import { RMHistogram, SetupPerformanceBars, DailyHeatStrip, WinRateGauge, DisciplineScoreRing, SetupTrends, StreakVisualizer } from './visualizations'
import { QuickLogger } from './QuickLogger'
import { History as HistoryComponent } from './History'
import { ChallengeDashboard } from './ChallengeDashboard'
import { ChallengeSetup } from './ChallengeSetup'

type DesktopScreen = 'dashboard' | 'logger' | 'history' | 'analytics' | 'challenge' | 'settings'

interface DesktopLayoutProps {
  stats: {
    today: {
      count: number
      wins: number
      losses: number
      breakevens: number
      netR: number
      streak: number
      streakType: 'win' | 'loss' | null
    }
    allTime: {
      totalTrades: number
      winRate: number
      netR: number
      avgR: number
      calmTrades: number
      emotionalTrades: number
    }
  }
  disciplineAlerts: DisciplineAlert[]
  todayTrades: Trade[]
  allTimeTrades: Trade[]
  weeklyGoal: WeeklyGoal | null | undefined
  shouldShowGoalPrompt: boolean
  weeklyProgress: number
  isWeeklyGoalReached: boolean
  templates: TradeTemplate[]
  challenge: Challenge | null
  currentDayData: ChallengeDay | null
  progressStats: {
    currentBalance: number
    totalProfit: number
    progressPercent: number
    daysCompleted: number
    daysPassed: number
    daysFailed: number
    daysExtended: number
    daysRemaining: number
    isOnTrack: boolean
  } | null
  onStartNewTrade: () => void
  onSetWeeklyGoal: (targetR: number) => void
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => Trade
  updateTrade: (id: string, updates: Partial<Omit<Trade, 'id' | 'timestamp'>>) => void
  deleteTrade: (id: string) => void
  addTemplate: (template: Omit<TradeTemplate, 'id'>) => TradeTemplate
  deleteTemplate: (id: string) => void
  createChallenge: (input: ChallengeSetupInput) => void
  logDayTrades: (input: { dayNumber: number; profit: number; trades: string[]; notes: string }) => AdaptiveAdjustment
  recalculatePlan: (dayNumber: number, profit: number, adjustment: 'stay' | 'extend' | 'reduce_risk', additionalDays?: number) => AdaptiveAdjustment
  deleteChallenge: () => void
  updateCurrentR: () => void
}

export function DesktopLayout({
  stats,
  disciplineAlerts,
  todayTrades,
  allTimeTrades,
  weeklyGoal,
  shouldShowGoalPrompt,
  weeklyProgress,
  isWeeklyGoalReached,
  templates,
  challenge,
  currentDayData,
  progressStats,
  onStartNewTrade,
  onSetWeeklyGoal,
  addTrade,
  updateTrade,
  deleteTrade,
  addTemplate,
  deleteTemplate,
  createChallenge,
  logDayTrades,
  recalculatePlan,
  deleteChallenge,
  updateCurrentR
}: DesktopLayoutProps) {
  const [currentScreen, setCurrentScreen] = useState<DesktopScreen>('dashboard')
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [duplicateTrade, setDuplicateTrade] = useState<Trade | null>(null)
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>('gold')

  // Load current theme and listen for changes
  useEffect(() => {
    const loadTheme = () => {
      const savedTheme = localStorage.getItem('trading-journal-theme') as ThemeColor
      if (savedTheme && themeColors[savedTheme]) {
        setCurrentTheme(savedTheme)
      }
    }
    
    // Load initial theme
    loadTheme()
    
    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trading-journal-theme') {
        loadTheme()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom theme change events (same tab)
    const handleThemeChange = () => {
      loadTheme()
    }
    window.addEventListener('theme-changed', handleThemeChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-changed', handleThemeChange)
    }
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logger', label: 'Log Trade', icon: PlusCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'challenge', label: 'Challenge', icon: Trophy },
  ]

  const handleTradeLogged = () => {
    setEditingTrade(null)
    setDuplicateTrade(null)
    updateCurrentR()
    setCurrentScreen('dashboard')
  }

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade)
    setDuplicateTrade(null)
    setCurrentScreen('logger')
  }

  const handleDuplicateTrade = (trade: Trade) => {
    setDuplicateTrade(trade)
    setEditingTrade(null)
    setCurrentScreen('logger')
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardOverview 
          stats={stats} 
          todayTrades={todayTrades} 
          allTimeTrades={allTimeTrades}
          disciplineAlerts={disciplineAlerts}
          weeklyGoal={weeklyGoal}
          weeklyProgress={weeklyProgress}
          isWeeklyGoalReached={isWeeklyGoalReached}
          onStartNewTrade={() => setCurrentScreen('logger')}
        />
      case 'logger':
        return (
          <div className="max-w-2xl mx-auto">
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
          </div>
        )
      case 'history':
        return (
          <HistoryComponent
            allTimeTrades={allTimeTrades}
            deleteTrade={deleteTrade}
            onDuplicateTrade={handleDuplicateTrade}
            onEditTrade={handleEditTrade}
          />
        )
      case 'analytics':
        return <AnalyticsView 
          stats={stats}
          allTimeTrades={allTimeTrades}
          todayTrades={todayTrades}
        />
      case 'challenge':
        return challenge && currentDayData && progressStats ? (
          <ChallengeDashboard
            challenge={challenge}
            progressStats={progressStats}
            currentDayData={currentDayData}
            onLogDay={(dayNumber, profit) => {
              logDayTrades({ dayNumber, profit, trades: [], notes: '' })
              return { success: true, newDailyRate: 0, newDailyTarget: 0, newLotSize: 0, adjustedDaysRemaining: 0 }
            }}
            onRecalculate={recalculatePlan}
            onDelete={() => {
              deleteChallenge()
              setCurrentScreen('dashboard')
            }}
          />
        ) : (
          <ChallengeSetup
            onCreate={(input) => {
              createChallenge(input)
              setCurrentScreen('challenge')
            }}
            onCancel={() => setCurrentScreen('dashboard')}
          />
        )
      case 'settings':
        return <SettingsView />
      default:
        return null
    }
  }

  return (
    <div className="dashboard-container desktop-only">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${themeColors[currentTheme].primary}, ${themeColors[currentTheme].secondary})`
              }}
            >
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg">AIOVAX</h1>
              <p className="text-xs text-[var(--text-muted)]">Trading Journal</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id as DesktopScreen)}
                className={`sidebar-item w-full text-left ${currentScreen === item.id ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => setCurrentScreen('settings')}
            className={`sidebar-item w-full text-left ${currentScreen === 'settings' ? 'active' : ''}`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="stat-label">Today's P&L</span>
              <span className={`text-2xl font-bold ${stats.today.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                {stats.today.netR >= 0 ? '+' : ''}{stats.today.netR.toFixed(2)}R
              </span>
            </div>
            <div className="h-8 w-px bg-[var(--border-soft)]" />
            <div className="flex items-center gap-2">
              <span className="stat-label">Win Rate</span>
              <span className="text-2xl font-bold text-[var(--gold-primary)]">
                {stats.allTime.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="h-8 w-px bg-[var(--border-soft)]" />
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="stat-label">Streak</span>
              <span className="text-xl font-bold">
                {stats.today.streak > 0 ? `${stats.today.streak}W` : stats.today.streak < 0 ? `${Math.abs(stats.today.streak)}L` : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {weeklyGoal && (
              <div className="flex items-center gap-3 bg-[var(--bg-card)] px-4 py-2 rounded-lg border border-[var(--border-soft)]">
                <Target className="w-4 h-4 text-[var(--gold-primary)]" />
                <div>
                  <span className="text-xs text-[var(--text-muted)]">Weekly Goal</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--gold-primary)] transition-all duration-300"
                        style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {weeklyGoal.currentR.toFixed(1)}/{weeklyGoal.targetR}R
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setCurrentScreen('logger')}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--gold-primary)] text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="w-4 h-4" />
              Log Trade
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-content">
          {renderScreen()}
        </div>
      </main>
    </div>
  )
}

// Dashboard Overview Component - Clean Bento-Style Layout
function DashboardOverview({ 
  stats, 
  todayTrades, 
  allTimeTrades,
  disciplineAlerts,
  weeklyGoal,
  weeklyProgress,
  isWeeklyGoalReached,
  onStartNewTrade
}: {
  stats: DesktopLayoutProps['stats']
  todayTrades: Trade[]
  allTimeTrades: Trade[]
  disciplineAlerts: DisciplineAlert[]
  weeklyGoal: WeeklyGoal | null | undefined
  weeklyProgress: number
  isWeeklyGoalReached: boolean
  onStartNewTrade: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Section: Key Metrics */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Performance Overview
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Total Trades Card */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Trades</span>
              <div className="w-8 h-8 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[var(--gold-primary)]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
              {stats.allTime.totalTrades}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--profit)] font-medium">{stats.today.wins}W</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-[var(--loss)] font-medium">{stats.today.losses}L</span>
              <span className="text-[var(--text-muted)] ml-1">today</span>
            </div>
          </div>

          {/* Net R Card */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Net R</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stats.allTime.netR >= 0 ? 'bg-[var(--profit-soft)]' : 'bg-[var(--loss-soft)]'
              }`}>
                <TrendingUp className={`w-4 h-4 ${
                  stats.allTime.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`} />
              </div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              stats.allTime.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
            }`}>
              {stats.allTime.netR >= 0 ? '+' : ''}{stats.allTime.netR.toFixed(2)}R
            </div>
            <div className="text-sm text-[var(--text-muted)]">
              Avg {stats.allTime.avgR.toFixed(2)}R per trade
            </div>
          </div>

          {/* Win Rate Card */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Win Rate</span>
              <div className="w-8 h-8 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
                <Target className="w-4 h-4 text-[var(--gold-primary)]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--gold-primary)] mb-1">
              {stats.allTime.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-[var(--text-muted)]">
              {stats.allTime.totalTrades > 0 ? Math.round(stats.allTime.winRate) : 0}% target
            </div>
          </div>

          {/* Discipline Card */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)] hover:border-[var(--gold-primary)]/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Discipline</span>
              <div className="w-8 h-8 rounded-lg bg-[var(--profit-soft)] flex items-center justify-center">
                <Flame className="w-4 h-4 text-[var(--profit)]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--profit)] mb-1">
              {stats.allTime.totalTrades > 0 
                ? Math.round((stats.allTime.calmTrades / stats.allTime.totalTrades) * 100)
                : 0}%
            </div>
            <div className="text-sm text-[var(--text-muted)]">
              {stats.allTime.calmTrades} calm trades
            </div>
          </div>
        </div>
      </section>

      {/* Section: Analytics */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Analytics
        </h2>
        <div className="grid grid-cols-12 gap-4">
          {/* R-Multiple Distribution - Takes 6 columns */}
          <div className="col-span-6 bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">R-Multiple Distribution</h3>
              <span className="text-xs text-[var(--text-muted)]">All time</span>
            </div>
            <RMHistogram trades={allTimeTrades} />
          </div>

          {/* 30-Day Heatmap - Takes 6 columns */}
          <div className="col-span-6 bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">30-Day Performance</h3>
              <span className="text-xs text-[var(--text-muted)]">Last 30 days</span>
            </div>
            <DailyHeatStrip trades={allTimeTrades} />
          </div>

          {/* Setup Performance - Takes 8 columns */}
          <div className="col-span-8 bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Setup Performance</h3>
              <span className="text-xs text-[var(--text-muted)]">Win rate by setup</span>
            </div>
            <SetupPerformanceBars trades={allTimeTrades} />
          </div>

          {/* Setup Trends - Takes 4 columns */}
          <div className="col-span-4 bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Setup Trends</h3>
              <span className="text-xs text-[var(--text-muted)]">20 trades</span>
            </div>
            <SetupTrends trades={allTimeTrades} />
          </div>
        </div>
      </section>

      {/* Section: Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Recent Trades
          </h2>
          <button 
            onClick={onStartNewTrade}
            className="text-sm text-[var(--gold-primary)] hover:text-[var(--gold-secondary)] font-medium transition-colors"
          >
            View All
          </button>
        </div>
        
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-soft)] overflow-hidden">
          {todayTrades.length > 0 ? (
            <div className="divide-y divide-[var(--border-soft)]">
              {todayTrades.slice(0, 5).map((trade) => (
                <div 
                  key={trade.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      trade.result === 'Win' ? 'bg-[var(--profit-soft)]' :
                      trade.result === 'Loss' ? 'bg-[var(--loss-soft)]' :
                      'bg-[var(--bg-tertiary)]'
                    }`}>
                      {trade.direction === 'buy' ? (
                        <TrendingUp className={`w-5 h-5 ${
                          trade.result === 'Win' ? 'text-[var(--profit)]' :
                          trade.result === 'Loss' ? 'text-[var(--loss)]' :
                          'text-[var(--text-muted)]'
                        }`} />
                      ) : (
                        <TrendingDown className={`w-5 h-5 ${
                          trade.result === 'Win' ? 'text-[var(--profit)]' :
                          trade.result === 'Loss' ? 'text-[var(--loss)]' :
                          'text-[var(--text-muted)]'
                        }`} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">
                        {trade.setup.join(', ')}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">
                        {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {trade.entryTrigger}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                      trade.result === 'Win' ? 'bg-[var(--profit-soft)] text-[var(--profit)]' :
                      trade.result === 'Loss' ? 'bg-[var(--loss-soft)] text-[var(--loss)]' :
                      'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                      {trade.result}
                    </span>
                    <span className={`text-lg font-bold ${
                      trade.result === 'Win' ? 'text-[var(--profit)]' :
                      trade.result === 'Loss' ? 'text-[var(--loss)]' :
                      'text-[var(--text-muted)]'
                    }`}>
                      {trade.result === 'Win' ? '+' : trade.result === 'Loss' ? '-' : ''}
                      {Math.abs(trade.rMultiple).toFixed(1)}R
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-muted)] mb-2">No trades today</p>
              <button 
                onClick={onStartNewTrade}
                className="text-[var(--gold-primary)] font-medium hover:underline"
              >
                Log your first trade
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// Analytics View Component - Organized Grid Layout with Profit Factor
function AnalyticsView({ 
  stats,
  allTimeTrades,
  todayTrades
}: {
  stats: DesktopLayoutProps['stats']
  allTimeTrades: Trade[]
  todayTrades: Trade[]
}) {
  // Calculate profit factor
  const winningTrades = allTimeTrades.filter(t => t.result === 'Win')
  const losingTrades = allTimeTrades.filter(t => t.result === 'Loss')
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.rMultiple, 0)
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + Math.abs(t.rMultiple), 0))
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? Infinity : 0)
  
  // Calculate expectancy
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0
  const winRate = stats.allTime.winRate / 100
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss)

  return (
    <div className="space-y-6">
      {/* Section: Key Metrics Grid - 2x2 Layout */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
          Key Metrics
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Win Rate */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
                <Target className="w-5 h-5 text-[var(--gold-primary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Win Rate</p>
                <p className="text-2xl font-bold text-[var(--gold-primary)]">{stats.allTime.winRate.toFixed(1)}%</p>
              </div>
            </div>
            <WinRateGauge winRate={stats.allTime.winRate} totalTrades={stats.allTime.totalTrades} />
          </div>

          {/* Net R */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stats.allTime.netR >= 0 ? 'bg-[var(--profit-soft)]' : 'bg-[var(--loss-soft)]'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  stats.allTime.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Net R</p>
                <p className={`text-2xl font-bold ${
                  stats.allTime.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`}>
                  {stats.allTime.netR >= 0 ? '+' : ''}{stats.allTime.netR.toFixed(2)}R
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {winningTrades.length}W / {losingTrades.length}L trades
            </p>
          </div>

          {/* Profit Factor */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                profitFactor >= 1.5 ? 'bg-[var(--profit-soft)]' : 
                profitFactor >= 1 ? 'bg-[var(--gold-soft)]' : 'bg-[var(--loss-soft)]'
              }`}>
                <BarChart3 className={`w-5 h-5 ${
                  profitFactor >= 1.5 ? 'text-[var(--profit)]' : 
                  profitFactor >= 1 ? 'text-[var(--gold-primary)]' : 'text-[var(--loss)]'
                }`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Profit Factor</p>
                <p className={`text-2xl font-bold ${
                  profitFactor >= 1.5 ? 'text-[var(--profit)]' : 
                  profitFactor >= 1 ? 'text-[var(--gold-primary)]' : 'text-[var(--loss)]'
                }`}>
                  {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {profitFactor >= 2 ? 'Excellent' : profitFactor >= 1.5 ? 'Good' : profitFactor >= 1 ? 'Break-even' : 'Poor'}
            </p>
          </div>

          {/* Expectancy */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                expectancy > 0 ? 'bg-[var(--profit-soft)]' : 'bg-[var(--loss-soft)]'
              }`}>
                <TrendingUp className={`w-5 h-5 ${
                  expectancy > 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Expectancy</p>
                <p className={`text-2xl font-bold ${
                  expectancy > 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`}>
                  {expectancy > 0 ? '+' : ''}{expectancy.toFixed(2)}R
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Expected return per trade
            </p>
          </div>
        </div>
      </section>

      {/* Section: Secondary Metrics */}
      <section>
        <div className="grid grid-cols-3 gap-4">
          {/* Discipline Score */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--profit-soft)] flex items-center justify-center">
                <Flame className="w-5 h-5 text-[var(--profit)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Discipline</p>
                <p className="text-xl font-bold text-[var(--profit)]">
                  {stats.allTime.totalTrades > 0 
                    ? Math.round((stats.allTime.calmTrades / stats.allTime.totalTrades) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            <DisciplineScoreRing 
              calmTrades={stats.allTime.calmTrades} 
              emotionalTrades={stats.allTime.emotionalTrades}
              totalTrades={stats.allTime.totalTrades}
            />
          </div>

          {/* Streak */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stats.today.streak > 0 ? 'bg-[var(--profit-soft)]' : 
                stats.today.streak < 0 ? 'bg-[var(--loss-soft)]' : 'bg-[var(--bg-tertiary)]'
              }`}>
                <Flame className={`w-5 h-5 ${
                  stats.today.streak > 0 ? 'text-[var(--profit)]' : 
                  stats.today.streak < 0 ? 'text-[var(--loss)]' : 'text-[var(--text-muted)]'
                }`} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Streak</p>
                <p className={`text-xl font-bold ${
                  stats.today.streak > 0 ? 'text-[var(--profit)]' : 
                  stats.today.streak < 0 ? 'text-[var(--loss)]' : 'text-[var(--text-muted)]'
                }`}>
                  {stats.today.streak !== 0 ? `${Math.abs(stats.today.streak)} ${stats.today.streak > 0 ? 'Win' : 'Loss'}` : 'None'}
                </p>
              </div>
            </div>
            <StreakVisualizer streak={stats.today.streak} streakType={stats.today.streakType} />
          </div>

          {/* Total Trades */}
          <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-soft)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--gold-soft)] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[var(--gold-primary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Total Trades</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stats.allTime.totalTrades}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--profit)]">{winningTrades.length} wins</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-[var(--loss)]">{losingTrades.length} losses</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Charts Row 1 */}
      <section className="grid grid-cols-2 gap-5">
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-soft)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">R-Multiple Distribution</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-[var(--profit)]" />
                <span className="text-[var(--text-muted)]">Win</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-[var(--loss)]" />
                <span className="text-[var(--text-muted)]">Loss</span>
              </div>
            </div>
          </div>
          <RMHistogram trades={allTimeTrades} />
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-soft)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">30-Day Performance</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-[var(--profit)]" />
                <span className="text-[var(--text-muted)]">Profit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-[var(--loss)]" />
                <span className="text-[var(--text-muted)]">Loss</span>
              </div>
            </div>
          </div>
          <DailyHeatStrip trades={allTimeTrades} />
        </div>
      </section>

      {/* Section: Charts Row 2 */}
      <section className="grid grid-cols-2 gap-5">
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-soft)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Setup Performance</h3>
          <SetupPerformanceBars trades={allTimeTrades} />
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-soft)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Setup Trends (20 trades)</h3>
          <SetupTrends trades={allTimeTrades} />
        </div>
      </section>
    </div>
  )
}

// Settings View Component
function SettingsView() {
  const [activeSection, setActiveSection] = useState<'general' | 'data' | 'about'>('general')
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>('gold')

  // Load theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('trading-journal-theme') as ThemeColor
    if (saved && themeColors[saved]) {
      setCurrentTheme(saved)
    }
  }, [])

  const handleThemeChange = (theme: ThemeColor) => {
    setCurrentTheme(theme)
    const colors = themeColors[theme]
    const root = document.documentElement
    root.style.setProperty('--gold-primary', colors.primary)
    root.style.setProperty('--gold-secondary', colors.secondary)
    root.style.setProperty('--gold-glow', colors.glow)
    root.style.setProperty('--gold-soft', colors.soft)
    localStorage.setItem('trading-journal-theme', theme)
    // Dispatch custom event for same-tab communication
    window.dispatchEvent(new Event('theme-changed'))
  }
  
  const handleExportData = () => {
    const data = {
      trades: JSON.parse(localStorage.getItem('trades') || '[]'),
      challenge: JSON.parse(localStorage.getItem('challenge') || 'null'),
      weeklyGoal: JSON.parse(localStorage.getItem('weeklyGoal') || 'null'),
      templates: JSON.parse(localStorage.getItem('tradeTemplates') || '[]'),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleClearData = () => {
    if (confirm('Are you sure? This will delete ALL your trades, challenge progress, and settings. This cannot be undone.')) {
      localStorage.removeItem('trades')
      localStorage.removeItem('challenge')
      localStorage.removeItem('weeklyGoal')
      localStorage.removeItem('tradeTemplates')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        Settings
      </h2>
      
      {/* Settings Navigation */}
      <div className="flex gap-2">
        {[
          { id: 'general', label: 'General' },
          { id: 'data', label: 'Data' },
          { id: 'about', label: 'About' },
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-[var(--gold-primary)] text-black'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeSection === 'general' && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-soft)] space-y-6">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Accent Color</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Choose your preferred accent color theme.
            </p>
            <div className="grid grid-cols-5 gap-3">
              {(Object.keys(themeColors) as ThemeColor[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    currentTheme === theme 
                      ? 'border-[var(--gold-primary)] bg-[var(--gold-soft)]' 
                      : 'border-transparent bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg mx-auto mb-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${themeColors[theme].primary}, ${themeColors[theme].secondary})` 
                    }}
                  />
                  <span className="text-xs capitalize text-[var(--text-secondary)]">{theme}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="border-t border-[var(--border-soft)] pt-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Notifications</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Browser notifications for discipline alerts and weekly goal reminders.
            </p>
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-[var(--gold-primary)]" />
              <span>Enable notifications</span>
            </label>
          </div>
        </div>
      )}

      {/* Data Management */}
      {activeSection === 'data' && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-soft)] space-y-6">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Export Data</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Download all your trades, challenge progress, and settings as a JSON file.
            </p>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-[var(--gold-primary)] text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Export Backup
            </button>
          </div>
          
          <div className="border-t border-[var(--border-soft)] pt-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Import Data</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Restore your data from a backup file.
            </p>
            <label className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg font-medium cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors inline-block">
              <input type="file" accept=".json" className="hidden" />
              Import Backup
            </label>
          </div>
          
          <div className="border-t border-[var(--border-soft)] pt-6">
            <h3 className="font-semibold text-[var(--loss)] mb-2">Danger Zone</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Permanently delete all your data. This action cannot be undone.
            </p>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-[var(--loss)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Clear All Data
            </button>
          </div>
        </div>
      )}

      {/* About */}
      {activeSection === 'about' && (
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-soft)] space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--gold-primary)] to-[var(--gold-secondary)] flex items-center justify-center">
              <span className="text-2xl font-bold text-black">A</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">AIOVAX Trading Journal</h3>
              <p className="text-sm text-[var(--text-muted)]">Version 1.0.0</p>
            </div>
          </div>
          
          <p className="text-[var(--text-secondary)]">
            A professional trading journal for XAUUSD (Gold) traders. Track your trades, 
            analyze your performance, and improve your discipline with detailed analytics 
            and visualizations.
          </p>
          
          <div className="border-t border-[var(--border-soft)] pt-4">
            <h4 className="font-medium text-[var(--text-primary)] mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
                Trade logging with templates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
                R-multiple tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
                Weekly goals & challenges
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
                Performance analytics
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" />
                Discipline scoring
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
