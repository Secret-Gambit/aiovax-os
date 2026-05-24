import { useState } from 'react'
import type { Trade, TradeTemplate } from '../types/trade'
import type { Challenge, ChallengeDay, ChallengeSetupInput, AdaptiveAdjustment } from '../types/challenge'
import type { DisciplineAlert } from '../hooks/useTrades'
import type { WeeklyGoal } from '../hooks/useWeeklyGoals'
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BarChart3, 
  Trophy, 
  Settings,
  TrendingUp,
  Flame,
  Target
} from 'lucide-react'
import { RMHistogram, SetupPerformanceBars, DailyHeatStrip, WinRateGauge, DisciplineScoreRing, SetupTrends, StreakVisualizer } from './visualizations'
import { QuickLogger } from './QuickLogger'
import { History as HistoryComponent } from './History'
import { ChallengeDashboard } from './ChallengeDashboard'
import { ChallengeSetup } from './ChallengeSetup'

type DesktopScreen = 'dashboard' | 'logger' | 'history' | 'analytics' | 'challenge'

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
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
          <div className="sidebar-item">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </div>
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

// Dashboard Overview Component
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
    <div className="dashboard-grid">
      {/* Stats Row */}
      <div className="dashboard-card col-3">
        <div className="stat-label mb-1">Total Trades</div>
        <div className="stat-value">{stats.allTime.totalTrades}</div>
        <div className="mt-2 text-sm text-[var(--text-muted)]">
          <span className="text-[var(--profit)]">{stats.today.wins}W</span> / 
          <span className="text-[var(--loss)]"> {stats.today.losses}L</span> today
        </div>
      </div>

      <div className="dashboard-card col-3">
        <div className="stat-label mb-1">Net R</div>
        <div className={`stat-value ${stats.allTime.netR >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
          {stats.allTime.netR >= 0 ? '+' : ''}{stats.allTime.netR.toFixed(2)}
        </div>
        <div className="mt-2 text-sm text-[var(--text-muted)]">
          Avg: {stats.allTime.avgR.toFixed(2)}R per trade
        </div>
      </div>

      <div className="dashboard-card col-3">
        <div className="stat-label mb-1">Win Rate</div>
        <div className="stat-value text-[var(--gold-primary)]">{stats.allTime.winRate.toFixed(1)}%</div>
        <div className="mt-2">
          <WinRateGauge winRate={stats.allTime.winRate} totalTrades={stats.allTime.totalTrades} />
        </div>
      </div>

      <div className="dashboard-card col-3">
        <div className="stat-label mb-1">Discipline Score</div>
        <div className="stat-value text-[var(--profit)]">
          {stats.allTime.totalTrades > 0 
            ? Math.round((stats.allTime.calmTrades / stats.allTime.totalTrades) * 100)
            : 0}%
        </div>
        <div className="mt-2 text-sm text-[var(--text-muted)]">
          {stats.allTime.calmTrades} calm / {stats.allTime.emotionalTrades} emotional
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-card col-6">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">R-Multiple Distribution</span>
        </div>
        <RMHistogram trades={allTimeTrades} />
      </div>

      <div className="dashboard-card col-6">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">30-Day Performance</span>
        </div>
        <DailyHeatStrip trades={allTimeTrades} />
      </div>

      {/* Setup Performance */}
      <div className="dashboard-card col-8">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Setup Performance</span>
        </div>
        <SetupPerformanceBars trades={allTimeTrades} />
      </div>

      <div className="dashboard-card col-4">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Setup Trends</span>
        </div>
        <SetupTrends trades={allTimeTrades} />
      </div>

      {/* Recent Trades */}
      <div className="dashboard-card col-12">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Recent Trades</span>
          <button 
            onClick={onStartNewTrade}
            className="text-sm text-[var(--gold-primary)] hover:underline"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {todayTrades.slice(0, 5).map((trade) => (
            <div 
              key={trade.id}
              className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-soft)]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  trade.result === 'Win' ? 'bg-[var(--profit-soft)] text-[var(--profit)]' :
                  trade.result === 'Loss' ? 'bg-[var(--loss-soft)] text-[var(--loss)]' :
                  'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                }`}>
                  {trade.result}
                </span>
              </div>
              <div className="font-medium mb-1">{trade.setup.join(', ')}</div>
              <div className={`text-lg font-bold ${
                trade.result === 'Win' ? 'text-[var(--profit)]' :
                trade.result === 'Loss' ? 'text-[var(--loss)]' :
                'text-[var(--text-muted)]'
              }`}>
                {trade.result === 'Win' ? '+' : trade.result === 'Loss' ? '-' : ''}
                {Math.abs(trade.rMultiple).toFixed(1)}R
              </div>
            </div>
          ))}
          {todayTrades.length === 0 && (
            <div className="col-span-5 text-center py-8 text-[var(--text-muted)]">
              No trades today. Click "Log Trade" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Analytics View Component
function AnalyticsView({ 
  stats,
  allTimeTrades,
  todayTrades
}: {
  stats: DesktopLayoutProps['stats']
  allTimeTrades: Trade[]
  todayTrades: Trade[]
}) {
  return (
    <div className="dashboard-grid">
      <div className="dashboard-card col-4">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Win Rate Gauge</span>
        </div>
        <WinRateGauge winRate={stats.allTime.winRate} totalTrades={stats.allTime.totalTrades} />
      </div>

      <div className="dashboard-card col-4">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Discipline Score</span>
        </div>
        <DisciplineScoreRing 
          calmTrades={stats.allTime.calmTrades} 
          emotionalTrades={stats.allTime.emotionalTrades}
          totalTrades={stats.allTime.totalTrades}
        />
      </div>

      <div className="dashboard-card col-4">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Current Streak</span>
        </div>
        <StreakVisualizer streak={stats.today.streak} streakType={stats.today.streakType} />
      </div>

      <div className="dashboard-card col-12">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">R-Multiple Distribution</span>
        </div>
        <RMHistogram trades={allTimeTrades} />
      </div>

      <div className="dashboard-card col-6">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Setup Performance</span>
        </div>
        <SetupPerformanceBars trades={allTimeTrades} />
      </div>

      <div className="dashboard-card col-6">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Setup Trends (20 trades)</span>
        </div>
        <SetupTrends trades={allTimeTrades} />
      </div>

      <div className="dashboard-card col-12">
        <div className="dashboard-card-header">
          <span className="dashboard-card-title">Daily Performance Heatmap</span>
        </div>
        <DailyHeatStrip trades={allTimeTrades} />
      </div>
    </div>
  )
}
